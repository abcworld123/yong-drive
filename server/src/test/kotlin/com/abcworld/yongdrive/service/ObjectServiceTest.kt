package com.abcworld.yongdrive.service

import com.abcworld.yongdrive.dto.request.CreateFolderRequest
import com.abcworld.yongdrive.dto.request.DeleteRequest
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
import kotlin.io.path.isDirectory
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class ObjectServiceTest {

    @TempDir
    lateinit var root: Path

    private lateinit var cache: FakeObjectCache
    private lateinit var service: ObjectService
    private lateinit var bucket: Path

    @BeforeEach
    fun setUp() {
        cache = FakeObjectCache()
        service = ObjectService(storageAt(root), cache)
        bucket = root.dir("b")
    }

    @Test
    fun `createFolder creates the folder and invalidates the parent listing`() {
        runTest {
            service.createFolder(CreateFolderRequest(bucket = "b", path = "docs/", foldername = "new"))
            assertTrue(bucket.resolve("docs/new").isDirectory())
            assertEquals(listOf("b" to "docs/"), cache.invalidatedTrees)
        }
    }

    @Test
    fun `createFolder on an existing name is a conflict`() {
        runTest {
            bucket.dir("docs/new")
            val error = assertFailsWith<ConflictException> {
                service.createFolder(CreateFolderRequest(bucket = "b", path = "docs/", foldername = "new"))
            }
            assertEquals("폴더가 이미 존재합니다.", error.message)
            assertEquals(emptyList(), cache.invalidatedTrees)
        }
    }

    @Test
    fun `delete removes the listed items and invalidates the listing`() {
        runTest {
            bucket.file("docs/a.txt")
            bucket.file("docs/dir/b.txt")
            bucket.file("docs/keep.txt")
            service.delete(DeleteRequest(bucket = "b", path = "docs/", objects = listOf("a.txt", "dir/")))
            assertEquals(setOf("docs/keep.txt"), bucket.tree().keys)
            assertEquals(listOf("b" to "docs/"), cache.invalidatedTrees)
        }
    }
}
