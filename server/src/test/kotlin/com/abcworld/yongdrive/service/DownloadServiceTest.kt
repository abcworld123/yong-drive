package com.abcworld.yongdrive.service

import com.abcworld.yongdrive.dto.request.DownloadRequest
import com.abcworld.yongdrive.support.FakeObjectCache
import com.abcworld.yongdrive.support.dir
import com.abcworld.yongdrive.support.file
import com.abcworld.yongdrive.support.storageAt
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.io.TempDir
import org.springframework.core.io.FileSystemResource
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import java.nio.file.Path
import java.util.zip.ZipInputStream
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

class DownloadServiceTest {

    @TempDir
    lateinit var root: Path

    private lateinit var service: DownloadService
    private lateinit var bucket: Path

    @BeforeEach
    fun setUp() {
        val storage = storageAt(root)
        service = DownloadService(storage, ObjectService(storage, FakeObjectCache()))
        bucket = root.dir("b")
    }

    private fun unzip(response: ResponseEntity<Resource>): Map<String, String> {
        val entries = mutableMapOf<String, String>()
        ZipInputStream(response.body!!.inputStream).use { zip ->
            while (true) {
                val entry = zip.nextEntry ?: break
                entries[entry.name] = zip.readBytes().decodeToString()
            }
        }
        return entries
    }

    private fun disposition(response: ResponseEntity<Resource>): String {
        return response.headers.getFirst(HttpHeaders.CONTENT_DISPOSITION).orEmpty()
    }

    @Test
    fun `one file is sent raw as a file resource so ranges work`() {
        runTest {
            bucket.file("docs/a b.txt", "A")
            val response = service.download(DownloadRequest("b", "docs/", listOf("a b.txt")))
            assertEquals(HttpStatus.OK, response.statusCode)
            assertIs<FileSystemResource>(response.body)
            assertEquals("attachment; filename=\"a%20b.txt\"", disposition(response))
        }
    }

    @Test
    fun `a missing single file is a 404`() {
        runTest {
            val response = service.download(DownloadRequest("b", "", listOf("nope.txt")))
            assertEquals(HttpStatus.NOT_FOUND, response.statusCode)
        }
    }

    @Test
    fun `several items become one zip named after the current folder`() {
        runTest {
            bucket.file("docs/a.txt", "A")
            bucket.file("docs/dir/b.txt", "B")
            bucket.file("docs/dir/sub/c.txt", "C")
            val response = service.download(DownloadRequest("b", "docs/", listOf("a.txt", "dir/", "gone.txt")))
            assertEquals(mapOf("a.txt" to "A", "dir/b.txt" to "B", "dir/sub/c.txt" to "C"), unzip(response))
            assertEquals("attachment; filename=\"docs.zip\"", disposition(response))
        }
    }

    @Test
    fun `a single folder zips its contents without the folder itself as the top level`() {
        runTest {
            bucket.file("photos/a.jpg", "A")
            bucket.file("photos/2026/b.jpg", "B")
            val response = service.download(DownloadRequest("b", "", listOf("photos/")))
            assertEquals(mapOf("a.jpg" to "A", "2026/b.jpg" to "B"), unzip(response))
            assertEquals("attachment; filename=\"photos.zip\"", disposition(response))
        }
    }

    @Test
    fun `items at the bucket root zip as index`() {
        runTest {
            bucket.file("a.txt", "A")
            bucket.file("b.txt", "B")
            val response = service.download(DownloadRequest("b", "", listOf("a.txt", "b.txt")))
            assertEquals("attachment; filename=\"index.zip\"", disposition(response))
        }
    }

    @Test
    fun `korean names are percent encoded in the header`() {
        runTest {
            bucket.file("사진/a.jpg", "A")
            val response = service.download(DownloadRequest("b", "", listOf("사진/")))
            assertEquals("attachment; filename=\"%EC%82%AC%EC%A7%84.zip\"", disposition(response))
        }
    }
}
