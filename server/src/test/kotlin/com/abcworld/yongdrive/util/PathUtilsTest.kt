package com.abcworld.yongdrive.util

import com.abcworld.yongdrive.exception.ApiException
import org.junit.jupiter.api.io.TempDir
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class PathUtilsTest {

    @TempDir
    lateinit var root: Path

    private val rootProp get() = root.toString()
    private val bucketRoot get() = root.resolve("b").toAbsolutePath().normalize()

    @Test
    fun `resolves a key inside the bucket`() {
        assertEquals(bucketRoot.resolve("a/b.txt"), PathUtils.resolveSafe(rootProp, "b", "a/b.txt"))
    }

    @Test
    fun `leading slashes stay inside the bucket instead of becoming absolute`() {
        assertEquals(bucketRoot.resolve("etc/passwd"), PathUtils.resolveSafe(rootProp, "b", "/etc/passwd"))
        assertEquals(bucketRoot.resolve("x"), PathUtils.resolveSafe(rootProp, "b", "///x"))
    }

    @Test
    fun `an empty key is the bucket root`() {
        assertEquals(bucketRoot, PathUtils.resolveSafe(rootProp, "b", ""))
    }

    @Test
    fun `dot segments that stay inside the bucket are allowed`() {
        assertEquals(bucketRoot.resolve("b.txt"), PathUtils.resolveSafe(rootProp, "b", "a/../b.txt"))
    }

    @ParameterizedTest
    @ValueSource(
        strings = [
            "..",
            "../other",
            "a/../../other",
            "%2e%2e/other",
            "%2E%2E%2Fother",
            "a/%2e%2e/%2e%2e/other",
        ],
    )
    fun `keys escaping the bucket are rejected`(key: String) {
        assertFailsWith<ApiException> { PathUtils.resolveSafe(rootProp, "b", key) }
    }

    @Test
    fun `a sibling bucket sharing the name prefix is not inside the bucket`() {
        // "b2" starts with "b" as a string, but not as a path.
        assertFailsWith<ApiException> { PathUtils.resolveSafe(rootProp, "b", "../b2/x") }
    }

    @ParameterizedTest
    @ValueSource(strings = ["", " ", ".", "..", "a/b", "a\\b", "../b"])
    fun `invalid bucket names are rejected`(bucket: String) {
        assertFailsWith<IllegalArgumentException> { PathUtils.bucketRoot(rootProp, bucket) }
    }

    @Test
    fun `decode handles percent escapes and keeps malformed input as is`() {
        assertEquals("한글 파일.txt", PathUtils.decode("%ED%95%9C%EA%B8%80%20%ED%8C%8C%EC%9D%BC.txt"))
        assertEquals("100%", PathUtils.decode("100%"))
    }

    @Test
    fun `decode turns plus into a space`() {
        // URLDecoder is form decoding; a literal "+" in a name only survives when the client sends %2B.
        assertEquals("a b", PathUtils.decode("a+b"))
        assertEquals("a+b", PathUtils.decode("a%2Bb"))
    }

    @Test
    fun `folder keys end with a slash`() {
        assertEquals(true, PathUtils.isFolderKey("a/"))
        assertEquals(false, PathUtils.isFolderKey("a"))
        assertEquals("a", PathUtils.stripTrailingSlash("a/"))
        assertEquals("a", PathUtils.stripTrailingSlash("a"))
    }
}
