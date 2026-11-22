package com.abcworld.yongdrive.service

import com.abcworld.yongdrive.dto.request.PasteRequest
import com.abcworld.yongdrive.dto.request.PasteRequest.Companion.MODE_COPY
import com.abcworld.yongdrive.dto.request.PasteRequest.Companion.MODE_CUT
import com.abcworld.yongdrive.dto.request.PasteRequest.Companion.RESOLVE_OVERWRITE
import com.abcworld.yongdrive.dto.request.PasteRequest.Companion.RESOLVE_RENAME
import com.abcworld.yongdrive.dto.request.PasteRequest.Companion.RESOLVE_SKIP
import com.abcworld.yongdrive.exception.ApiException
import com.abcworld.yongdrive.exception.ConflictException
import com.abcworld.yongdrive.support.FakeObjectCache
import com.abcworld.yongdrive.support.dir
import com.abcworld.yongdrive.support.file
import com.abcworld.yongdrive.support.storageAt
import com.abcworld.yongdrive.support.tree
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class PasteServiceTest {

    @TempDir
    lateinit var root: Path

    private lateinit var cache: FakeObjectCache
    private lateinit var service: PasteService
    private lateinit var bucket: Path

    @BeforeEach
    fun setUp() {
        cache = FakeObjectCache()
        service = PasteService(storageAt(root), cache)
        bucket = root.dir("b")
    }

    private fun request(
        vararg objects: String,
        mode: String = MODE_COPY,
        from: String = "from/",
        to: String = "to/",
        bucketTo: String = "",
        resolutions: Map<String, String> = emptyMap(),
    ): PasteRequest {
        return PasteRequest(
            bucket = "b",
            bucketTo = bucketTo,
            pathFrom = from,
            pathTo = to,
            objects = objects.toList(),
            mode = mode,
            resolutions = resolutions,
        )
    }

    @Test
    fun `copy duplicates files and folders and keeps the sources`() {
        runTest {
            bucket.file("from/a.txt", "A")
            bucket.file("from/dir/b.txt", "B")
            bucket.dir("to")
            service.paste(request("a.txt", "dir/"))
            assertEquals(
                mapOf("from/a.txt" to "A", "from/dir/b.txt" to "B", "to/a.txt" to "A", "to/dir/b.txt" to "B"),
                bucket.tree(),
            )
        }
    }

    @Test
    fun `cut moves items and invalidates both source and destination listings`() {
        runTest {
            bucket.file("from/a.txt", "A")
            bucket.file("from/dir/b.txt", "B")
            service.paste(request("a.txt", "dir/", mode = MODE_CUT))
            assertEquals(mapOf("to/a.txt" to "A", "to/dir/b.txt" to "B"), bucket.tree())
            assertEquals(listOf("b" to "from/", "b" to "to/"), cache.invalidatedTrees)
        }
    }

    @Test
    fun `copy only invalidates the destination`() {
        runTest {
            bucket.file("from/a.txt")
            service.paste(request("a.txt"))
            assertEquals(listOf("b" to "to/"), cache.invalidatedTrees)
        }
    }

    @Test
    fun `pastes into another bucket`() {
        runTest {
            bucket.file("from/a.txt", "A")
            val other = root.dir("c")
            service.paste(request("a.txt", mode = MODE_CUT, to = "", bucketTo = "c"))
            assertEquals(mapOf("a.txt" to "A"), other.tree())
            assertEquals(emptyMap(), bucket.tree())
        }
    }

    @Test
    fun `check reports conflicts and missing sources`() {
        runTest {
            bucket.file("from/a.txt", "new")
            bucket.file("from/free.txt")
            bucket.file("to/a.txt", "old!")
            val check = service.check(request("a.txt", "free.txt", "gone.txt"))
            val conflict = check.conflicts.single()
            assertEquals("a.txt", conflict.name)
            assertEquals(3L, conflict.src.size)
            assertEquals(4L, conflict.dst.size)
            assertEquals(listOf("gone.txt"), check.missing)
        }
    }

    @Test
    fun `a conflict without a resolution is a 409 and changes nothing`() {
        runTest {
            bucket.file("from/a.txt", "new")
            bucket.file("from/b.txt", "B")
            bucket.file("to/b.txt", "old")
            val before = bucket.tree()
            // a.txt is free and comes first, so this also proves nothing is written before every item is resolved.
            assertFailsWith<ConflictException> { service.paste(request("a.txt", "b.txt")) }
            assertEquals(before, bucket.tree())
        }
    }

    @Test
    fun `skip leaves the destination alone`() {
        runTest {
            bucket.file("from/a.txt", "new")
            bucket.file("to/a.txt", "old")
            service.paste(request("a.txt", mode = MODE_CUT, resolutions = mapOf("a.txt" to RESOLVE_SKIP)))
            assertEquals(mapOf("from/a.txt" to "new", "to/a.txt" to "old"), bucket.tree())
        }
    }

    @Test
    fun `overwrite replaces a folder instead of merging into it`() {
        runTest {
            bucket.file("from/dir/new.txt", "N")
            bucket.file("to/dir/old.txt", "O")
            service.paste(request("dir/", resolutions = mapOf("dir/" to RESOLVE_OVERWRITE)))
            assertEquals(setOf("from/dir/new.txt", "to/dir/new.txt"), bucket.tree().keys)
        }
    }

    @Test
    fun `rename numbers files before the extension`() {
        runTest {
            bucket.file("from/a.txt", "new")
            bucket.file("to/a.txt", "old")
            bucket.file("to/a (1).txt", "taken")
            service.paste(request("a.txt", resolutions = mapOf("a.txt" to RESOLVE_RENAME)))
            assertEquals("new", bucket.tree()["to/a (2).txt"])
        }
    }

    @Test
    fun `rename puts the number at the end for folders and dotfiles`() {
        runTest {
            bucket.file("from/.env", "new")
            bucket.file("from/my.dir/x.txt", "X")
            bucket.file("to/.env", "old")
            bucket.file("to/my.dir/x.txt", "old")
            val renameAll = mapOf(".env" to RESOLVE_RENAME, "my.dir/" to RESOLVE_RENAME)
            service.paste(request(".env", "my.dir/", resolutions = renameAll))
            val tree = bucket.tree()
            assertEquals("new", tree["to/.env (1)"])
            assertEquals("X", tree["to/my.dir (1)/x.txt"])
        }
    }

    @Test
    fun `rename avoids names that other items in the same batch will take`() {
        runTest {
            bucket.file("from/a.txt", "first")
            bucket.file("from/a (1).txt", "second")
            bucket.file("to/a.txt", "old")
            service.paste(request("a.txt", "a (1).txt", resolutions = mapOf("a.txt" to RESOLVE_RENAME)))
            val tree = bucket.tree()
            assertEquals("old", tree["to/a.txt"])
            assertEquals("second", tree["to/a (1).txt"])
            assertEquals("first", tree["to/a (2).txt"])
        }
    }

    @Test
    fun `copy into the same folder auto renames and cut is a no-op`() {
        runTest {
            bucket.file("from/a.txt", "A")
            service.paste(request("a.txt", to = "from/"))
            assertEquals(mapOf("from/a.txt" to "A", "from/a (1).txt" to "A"), bucket.tree())

            service.paste(request("a.txt", to = "from/", mode = MODE_CUT))
            assertEquals(setOf("from/a.txt", "from/a (1).txt"), bucket.tree().keys)
        }
    }

    @Test
    fun `missing sources are skipped`() {
        runTest {
            bucket.file("from/a.txt", "A")
            service.paste(request("a.txt", "gone.txt", mode = MODE_CUT))
            assertEquals(mapOf("to/a.txt" to "A"), bucket.tree())
        }
    }

    @Test
    fun `a folder cannot go into itself or its descendant`() {
        runTest {
            bucket.file("from/dir/sub/a.txt")
            val before = bucket.tree()
            val intoSelf = assertFailsWith<ApiException> { service.paste(request("dir/", to = "from/dir/")) }
            assertTrue("자기 자신 안으로" in intoSelf.message.orEmpty())
            assertFailsWith<ApiException> { service.paste(request("dir/", to = "from/dir/sub/", mode = MODE_CUT)) }
            assertEquals(before, bucket.tree())
        }
    }

    @Test
    fun `overwriting a folder that contains the source is rejected`() {
        runTest {
            bucket.file("to/x/x/a.txt", "A")
            val before = bucket.tree()
            assertFailsWith<ApiException> {
                service.paste(
                    request("x/", from = "to/x/", to = "to/", mode = MODE_CUT, resolutions = mapOf("x/" to RESOLVE_OVERWRITE)),
                )
            }
            assertEquals(before, bucket.tree())
        }
    }

    @Test
    fun `names must be direct children of pathFrom`() {
        runTest {
            bucket.file("from/sub/a.txt")
            bucket.file("secret.txt")
            for (name in listOf("sub/a.txt", "../secret.txt", "", "..")) {
                assertFailsWith<ApiException>("name '$name'") { service.paste(request(name)) }
            }
        }
    }

    @Test
    fun `pasting onto a file path is rejected`() {
        runTest {
            bucket.file("from/a.txt")
            bucket.file("to.txt")
            assertFailsWith<ApiException> { service.paste(request("a.txt", to = "to.txt/")) }
        }
    }

    @Test
    fun `unknown mode and resolution values are rejected`() {
        runTest {
            bucket.file("from/a.txt")
            bucket.file("to/a.txt")
            assertFailsWith<ApiException> { service.paste(request("a.txt", mode = "move")) }
            assertFailsWith<ApiException> { service.paste(request("a.txt", resolutions = mapOf("a.txt" to "merge"))) }
        }
    }

    @Test
    fun `cache is invalidated even when the paste is rejected`() {
        runTest {
            bucket.file("from/a.txt")
            assertFailsWith<ApiException> { service.paste(request("a.txt", mode = "move")) }
            assertEquals(listOf("b" to "to/"), cache.invalidatedTrees)
        }
    }
}
