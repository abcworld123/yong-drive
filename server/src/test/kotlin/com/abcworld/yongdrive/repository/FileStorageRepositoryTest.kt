package com.abcworld.yongdrive.repository

import com.abcworld.yongdrive.entity.ObjectInfo
import com.abcworld.yongdrive.exception.ApiException
import com.abcworld.yongdrive.support.dir
import com.abcworld.yongdrive.support.file
import com.abcworld.yongdrive.support.storageAt
import com.abcworld.yongdrive.support.tree
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.io.TempDir
import org.springframework.core.io.buffer.DefaultDataBufferFactory
import java.nio.file.Path
import kotlin.io.path.exists
import kotlin.io.path.readText
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class FileStorageRepositoryTest {

    @TempDir
    lateinit var root: Path

    private lateinit var storage: FileStorageRepository
    private lateinit var bucket: Path

    @BeforeEach
    fun setUp() {
        storage = storageAt(root)
        bucket = root.dir("b")
    }

    @Test
    fun `lists buckets sorted by name and ignores loose files`() {
        root.dir("a")
        root.file("stray.txt")
        assertEquals(listOf("a", "b"), storage.listBuckets().map { it.name })
    }

    @Test
    fun `lists folders before files, each sorted by name`() {
        bucket.file("z.txt")
        bucket.file("a.txt")
        bucket.dir("y")
        bucket.dir("b")
        val names = storage.listObjects("b", "").map { it.name }
        assertEquals(listOf("b/", "y/", "a.txt", "z.txt"), names)
    }

    @Test
    fun `folder entries carry recursive file count and size`() {
        bucket.file("docs/a.txt", "12345")
        bucket.file("docs/sub/b.txt", "123")
        bucket.dir("docs/empty")
        val docs = storage.listObjects("b", "").single()
        assertEquals(ObjectInfo.TYPE_FOLDER, docs.type)
        assertEquals(2L, docs.fileCount)
        assertEquals(8L, docs.size)
    }

    @Test
    fun `file entries carry size and mtime`() {
        bucket.file("a.txt", "hello")
        val info = storage.listObjects("b", "").single()
        assertEquals(ObjectInfo.TYPE_FILE, info.type)
        assertEquals(5L, info.size)
        assertTrue((info.mtime ?: 0) > 0)
        assertNull(info.fileCount)
    }

    @Test
    fun `listing a missing folder or a file is empty`() {
        bucket.file("a.txt")
        assertEquals(emptyList(), storage.listObjects("b", "nope/"))
        assertEquals(emptyList(), storage.listObjects("b", "a.txt"))
    }

    @Test
    fun `createFolder makes nested folders and refuses an existing one`() {
        assertTrue(storage.createFolder("b", "x/y"))
        assertTrue(bucket.resolve("x/y").exists())
        assertFalse(storage.createFolder("b", "x/y/"))
    }

    @Test
    fun `delete removes files and whole folders`() {
        bucket.file("a.txt")
        bucket.file("dir/sub/c.txt")
        bucket.file("keep.txt")
        storage.delete("b", listOf("a.txt", "dir/", "missing.txt"))
        assertEquals(setOf("keep.txt"), bucket.tree().keys)
    }

    @Test
    fun `delete cannot reach outside the bucket`() {
        root.file("other/secret.txt")
        assertFailsWith<ApiException> { storage.delete("b", listOf("../other/secret.txt")) }
        assertTrue(root.resolve("other/secret.txt").exists())
    }

    @Test
    fun `move renames a folder with its contents`() {
        bucket.file("from/dir/a.txt", "A")
        storage.move(bucket.resolve("from/dir"), bucket.resolve("to/dir"))
        assertEquals(mapOf("to/dir/a.txt" to "A"), bucket.tree())
        assertFalse(bucket.resolve("from/dir").exists())
    }

    @Test
    fun `copy duplicates a folder tree and keeps the source`() {
        bucket.file("src/a.txt", "A")
        bucket.file("src/sub/b.txt", "B")
        bucket.dir("src/emptyDir")
        storage.copy(bucket.resolve("src"), bucket.resolve("dst"))
        assertEquals(
            mapOf("src/a.txt" to "A", "src/sub/b.txt" to "B", "dst/a.txt" to "A", "dst/sub/b.txt" to "B"),
            bucket.tree(),
        )
        assertTrue(bucket.resolve("dst/emptyDir").exists())
    }

    @Test
    fun `walkFiles returns slash separated paths relative to the folder`() {
        bucket.file("d/a.txt")
        bucket.file("d/sub/b.txt")
        val relative = storage.walkFiles("b", "d/").map { it.first }.sorted()
        assertEquals(listOf("a.txt", "sub/b.txt"), relative)
    }

    @Test
    fun `openFile only opens regular files`() {
        bucket.file("a.txt")
        bucket.dir("d")
        assertTrue(storage.openFile("b", "a.txt") != null)
        assertNull(storage.openFile("b", "d/"))
        assertNull(storage.openFile("b", "missing.txt"))
    }

    @Test
    fun `writeStream writes all chunks and replaces an existing file`() {
        runTest {
            bucket.file("up/a.txt", "old content that is longer")
            val factory = DefaultDataBufferFactory.sharedInstance
            val body = flowOf("hel", "lo").map { factory.wrap(it.toByteArray()) }
            storage.writeStream("b", "up/a.txt", body)
            assertEquals("hello", bucket.resolve("up/a.txt").readText())
        }
    }

    @Test
    fun `writeStream creates missing parent folders`() {
        runTest {
            val body = flowOf(DefaultDataBufferFactory.sharedInstance.wrap("x".toByteArray()))
            storage.writeStream("b", "new/deep/a.txt", body)
            assertEquals("x", bucket.resolve("new/deep/a.txt").readText())
        }
    }
}
