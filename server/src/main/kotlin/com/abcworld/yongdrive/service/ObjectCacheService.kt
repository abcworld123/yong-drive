package com.abcworld.yongdrive.service

import com.abcworld.yongdrive.config.CacheProperties
import com.abcworld.yongdrive.entity.ObjectInfo
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.reactive.asFlow
import kotlinx.coroutines.reactor.awaitSingle
import kotlinx.coroutines.reactor.awaitSingleOrNull
import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.readValue
import org.springframework.data.redis.core.ReactiveStringRedisTemplate
import org.springframework.data.redis.core.ScanOptions
import org.springframework.stereotype.Service
import java.time.Duration

@Service
class ObjectCacheService(
    private val redis: ReactiveStringRedisTemplate,
    private val objectMapper: ObjectMapper,
    private val cacheProperties: CacheProperties,
) {

    suspend fun get(bucket: String, path: String): List<ObjectInfo>? =
        redis.opsForValue().get(key(bucket, path))
            .awaitSingleOrNull()
            ?.let { objectMapper.readValue<List<ObjectInfo>>(it) }

    suspend fun put(bucket: String, path: String, objects: List<ObjectInfo>) {
        val json = objectMapper.writeValueAsString(objects)
        redis.opsForValue().set(
            key(bucket, path),
            json,
            Duration.ofSeconds(cacheProperties.objectListTtlSeconds),
        ).awaitSingleOrNull()
    }

    suspend fun invalidate(bucket: String, path: String): Long =
        redis.delete(key(bucket, path)).awaitSingle()

    suspend fun invalidatePrefix(bucket: String, pathPrefix: String): Long {
        val pattern = "${key(bucket, pathPrefix)}*"
        val keys = redis.scan(ScanOptions.scanOptions().match(pattern).count(1000).build())
            .asFlow().toList()
        return if (keys.isEmpty()) 0L
        else redis.delete(*keys.toTypedArray()).awaitSingle()
    }

    /**
     * Folder entries carry recursive file counts, sizes and mtimes, so a change under [path]
     * makes every ancestor listing stale too, not just [path] and its descendants.
     */
    suspend fun invalidateTree(bucket: String, path: String) {
        invalidatePrefix(bucket, path)
        val ancestors = ancestorPaths(path).map { key(bucket, it) }
        if (ancestors.isNotEmpty()) {
            redis.delete(*ancestors.toTypedArray()).awaitSingle()
        }
    }

    private fun ancestorPaths(path: String): List<String> {
        val segments = path.split('/').filter { it.isNotEmpty() }
        return (0 until segments.size).map { depth ->
            segments.take(depth).joinToString("") { "$it/" }
        }
    }

    private fun key(bucket: String, path: String): String = "$bucket/$path"
}
