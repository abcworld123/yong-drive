package com.abcworld.yongdrive.support

import com.abcworld.yongdrive.config.CacheProperties
import com.abcworld.yongdrive.config.StorageProperties
import com.abcworld.yongdrive.entity.ObjectInfo
import com.abcworld.yongdrive.repository.FileStorageRepository
import com.abcworld.yongdrive.service.ObjectCacheService
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory
import org.springframework.data.redis.core.ReactiveStringRedisTemplate
import tools.jackson.databind.json.JsonMapper
import java.nio.file.Files
import java.nio.file.Path
import kotlin.io.path.createDirectories
import kotlin.io.path.writeText

/**
 * Stands in for the Redis-backed cache so service tests need no Redis: it never hits,
 * and records invalidations. The template is built on a factory that is never started,
 * so nothing here opens a connection.
 */
class FakeObjectCache : ObjectCacheService(
    ReactiveStringRedisTemplate(LettuceConnectionFactory()),
    JsonMapper(),
    CacheProperties(),
) {
    val invalidatedTrees = mutableListOf<Pair<String, String>>()

    override suspend fun get(bucket: String, path: String): List<ObjectInfo>? {
        return null
    }

    override suspend fun put(bucket: String, path: String, objects: List<ObjectInfo>) {}

    override suspend fun invalidateTree(bucket: String, path: String) {
        invalidatedTrees += bucket to path
    }
}

fun storageAt(root: Path): FileStorageRepository {
    return FileStorageRepository(StorageProperties(root.toString()))
}

/** Creates a file (and its parent folders) under [root] with [content]. */
fun Path.file(relative: String, content: String = relative): Path {
    val path = resolve(relative)
    path.parent.createDirectories()
    path.writeText(content)
    return path
}

fun Path.dir(relative: String): Path {
    return resolve(relative).createDirectories()
}

/** Every regular file under this folder as "relative/path" to its content, for whole-tree assertions. */
fun Path.tree(): Map<String, String> {
    return Files.walk(this).use { stream ->
        stream.filter { Files.isRegularFile(it) }
            .toList()
            .associate { relativize(it).toString().replace('\\', '/') to Files.readString(it) }
    }
}
