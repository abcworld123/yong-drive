package com.abcworld.yongdrive.service

import com.abcworld.yongdrive.dto.request.PasteRequest
import com.abcworld.yongdrive.dto.response.PasteConflict
import com.abcworld.yongdrive.exception.ApiException
import com.abcworld.yongdrive.exception.ConflictException
import com.abcworld.yongdrive.repository.FileStorageRepository
import com.abcworld.yongdrive.util.PathUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.withContext
import org.springframework.stereotype.Service
import java.nio.file.Path
import kotlin.io.path.name

data class PasteCheck(
    val conflicts: List<PasteConflict>,
    val missing: List<String>,
)

/**
 * Cut moves with rename(2), so it takes the same time regardless of size; copy still writes every byte.
 * Every item is validated and resolved before the first change, so a bad request leaves the disk untouched.
 */
@Service
class PasteService(
    private val storage: FileStorageRepository,
    private val cache: ObjectCacheService,
) {

    private class Item(
        val name: String,
        val display: String,
        val src: Path,
        val dst: Path,
        val isFolder: Boolean,
    )

    private class Plan(val items: List<Item>, val missing: List<String>)

    private class Action(val item: Item, val target: Path, val replace: Boolean)

    suspend fun check(request: PasteRequest): PasteCheck {
        return withContext(Dispatchers.IO) {
            val plan = plan(request)
            val conflicts = plan.items
                .filter { it.dst != it.src && storage.exists(it.dst) }
                .map { PasteConflict(it.name, storage.objectInfo(it.src), storage.objectInfo(it.dst)) }
            PasteCheck(conflicts, plan.missing)
        }
    }

    suspend fun paste(request: PasteRequest) {
        val cut = request.mode == PasteRequest.MODE_CUT
        val bucketTo = bucketTo(request)
        try {
            withContext(Dispatchers.IO) {
                val actions = decide(plan(request).items, request.resolutions, cut)
                for (action in actions) {
                    if (action.replace) storage.delete(action.target)
                    if (cut) {
                        storage.move(action.item.src, action.target)
                    } else {
                        storage.copy(action.item.src, action.target)
                    }
                }
            }
        } finally {
            // A failure halfway still leaves earlier items moved, so the listings must be refreshed either way.
            withContext(NonCancellable) {
                if (cut) cache.invalidateTree(request.bucket, request.pathFrom)
                cache.invalidateTree(bucketTo, request.pathTo)
            }
        }
    }

    private fun bucketTo(request: PasteRequest): String {
        return request.bucketTo.ifBlank { request.bucket }
    }

    private fun plan(request: PasteRequest): Plan {
        val cut = when (request.mode) {
            PasteRequest.MODE_CUT -> true
            PasteRequest.MODE_COPY -> false
            else -> throw ApiException("알 수 없는 붙여넣기 방식입니다: ${request.mode}")
        }
        val bucketTo = bucketTo(request)
        val fromDir = storage.resolve(request.bucket, request.pathFrom)
        val toDir = storage.resolve(bucketTo, request.pathTo)
        if (storage.exists(toDir) && !storage.isDirectory(toDir)) {
            throw ApiException("붙여넣을 위치가 폴더가 아닙니다.")
        }

        val items = mutableListOf<Item>()
        val missing = mutableListOf<String>()
        for (name in request.objects.distinct()) {
            val display = PathUtils.stripTrailingSlash(name)
            val src = storage.resolve(request.bucket, "${request.pathFrom}$name")
            val dst = storage.resolve(bucketTo, "${request.pathTo}$name")
            // Names must be direct children of pathFrom; this also rejects "", "..", and names hiding a "/".
            if (src.parent != fromDir || dst.parent != toDir) {
                throw ApiException("잘못된 이름입니다: $display")
            }
            if (!storage.exists(src)) {
                missing += name
                continue
            }
            val isFolder = storage.isDirectory(src)
            if (isFolder && dst != src && dst.startsWith(src)) {
                val verb = if (cut) "옮길" else "복사할"
                throw ApiException("'$display' 폴더를 자기 자신 안으로 $verb 수 없습니다.")
            }
            items += Item(name, display, src, dst, isFolder)
        }
        return Plan(items, missing)
    }

    private fun decide(items: List<Item>, resolutions: Map<String, String>, cut: Boolean): List<Action> {
        // Names of the other incoming items are taken too: renaming "a" to "a (1)" must not collide
        // with an "a (1)" that is pasted later in the same batch.
        val reserved = items.map { it.dst.name }.toMutableSet()
        val actions = mutableListOf<Action>()
        for (item in items) {
            if (item.dst == item.src) {
                if (!cut) actions += Action(item, freeName(item, reserved), replace = false)
                continue
            }
            if (!storage.exists(item.dst)) {
                actions += Action(item, item.dst, replace = false)
                continue
            }
            when (resolutions[item.name]) {
                PasteRequest.RESOLVE_SKIP -> {}
                PasteRequest.RESOLVE_RENAME -> actions += Action(item, freeName(item, reserved), replace = false)
                PasteRequest.RESOLVE_OVERWRITE -> {
                    if (item.src.startsWith(item.dst)) {
                        throw ApiException("'${item.display}' 안에 원본이 있어서 덮어쓸 수 없습니다.")
                    }
                    actions += Action(item, item.dst, replace = true)
                }
                // Something appeared at the destination after the client's conflict check.
                null -> throw ConflictException("'${item.display}'이(가) 이미 있습니다. 다시 붙여넣어 주세요.")
                else -> throw ApiException("알 수 없는 선택입니다: ${resolutions[item.name]}")
            }
        }
        return actions
    }

    private fun freeName(item: Item, reserved: MutableSet<String>): Path {
        val name = item.dst.name
        var n = 1
        while (true) {
            val candidate = numberedName(name, item.isFolder, n)
            if (candidate.toByteArray().size > MAX_NAME_BYTES) {
                throw ApiException("'${item.display}'은(는) 이름이 너무 길어서 번호를 붙일 수 없습니다.")
            }
            val path = item.dst.resolveSibling(candidate)
            if (candidate !in reserved && !storage.exists(path)) {
                reserved += candidate
                return path
            }
            n++
        }
    }

    private fun numberedName(name: String, isFolder: Boolean, n: Int): String {
        val dot = name.lastIndexOf('.')
        // dot <= 0 keeps dotfiles like ".env" whole instead of treating the entire name as an extension.
        if (isFolder || dot <= 0) return "$name ($n)"
        return "${name.substring(0, dot)} ($n)${name.substring(dot)}"
    }

    companion object {
        private const val MAX_NAME_BYTES = 255
    }
}
