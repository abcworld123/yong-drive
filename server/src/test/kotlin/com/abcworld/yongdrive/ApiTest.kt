package com.abcworld.yongdrive

import com.abcworld.yongdrive.security.SecurityConstants
import com.abcworld.yongdrive.support.dir
import com.abcworld.yongdrive.support.file
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory
import org.springframework.data.redis.core.ReactiveStringRedisTemplate
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.web.reactive.server.WebTestClient
import org.springframework.util.LinkedMultiValueMap
import org.springframework.web.reactive.function.BodyInserters
import java.net.HttpCookie
import java.nio.file.Files
import java.nio.file.Path
import kotlin.io.path.deleteRecursively
import kotlin.io.path.exists
import kotlin.io.path.readText
import kotlin.io.path.ExperimentalPathApi
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Runs the whole app (security filters, Spring Session, exception handler) against the local Redis,
 * on database [REDIS_DB] so the dev data in database 0 is never touched. The database is flushed
 * before each test.
 */
@SpringBootTest
@AutoConfigureWebTestClient
class ApiTest {

    @Autowired
    lateinit var client: WebTestClient

    @Autowired
    lateinit var redis: ReactiveStringRedisTemplate

    @Autowired
    lateinit var connectionFactory: LettuceConnectionFactory

    private val bucket: Path get() = storageRoot.resolve("b")

    @BeforeEach
    fun setUp() {
        // Guard against a config change pointing the tests at the dev database before flushing it.
        check(connectionFactory.database == REDIS_DB) { "tests must run on Redis db $REDIS_DB" }
        redis.execute { it.serverCommands().flushDb() }.blockLast()
        Files.list(storageRoot).use { stream -> stream.forEach { deleteTree(it) } }
        storageRoot.dir("b")
    }

    private class Cookies(val session: String?, val cid: String?)

    private fun login(password: String = PASSWORD): Cookies {
        val result = client.post().uri("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(mapOf("pw" to password))
            .exchange()
            .expectStatus().isOk
            .expectBody()
            .returnResult()
        // Read Set-Cookie directly: with the mock server, responseCookies misses cookies that AuthService
        // writes as a raw header (cid), and the SESSION cookie only appears once the body is consumed.
        val cookies = result.responseHeaders[HttpHeaders.SET_COOKIE].orEmpty()
            .flatMap { HttpCookie.parse(it) }
            .associate { it.name to it.value }
        return Cookies(cookies["SESSION"], cookies[SecurityConstants.COOKIE_CID])
    }

    private fun post(uri: String, body: Any, session: String?): WebTestClient.ResponseSpec {
        val request = client.post().uri(uri).contentType(MediaType.APPLICATION_JSON)
        if (session != null) request.cookie("SESSION", session)
        return request.bodyValue(body).exchange()
    }

    @Test
    fun `guarded endpoints are 401 without a login`() {
        post("/bucket/get", emptyMap<String, String>(), session = null).expectStatus().isUnauthorized
        post("/object/get", mapOf("bucket" to "b", "path" to ""), session = null).expectStatus().isUnauthorized
        client.get().uri("/auth/check").exchange()
            .expectStatus().isOk
            .expectBody().jsonPath("$.success").isEqualTo(false)
    }

    @Test
    fun `a wrong password is a 200 with success false and sets no cookies`() {
        client.post().uri("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(mapOf("pw" to "wrong"))
            .exchange()
            .expectStatus().isOk
            .expectBody().jsonPath("$.success").isEqualTo(false)
        val cookies = login("wrong")
        assertNull(cookies.cid)
    }

    @Test
    fun `login issues a session that opens the guarded endpoints`() {
        val cookies = login()
        assertNotNull(cookies.session)
        assertNotNull(cookies.cid)
        client.get().uri("/auth/check").cookie("SESSION", cookies.session).exchange()
            .expectBody().jsonPath("$.success").isEqualTo(true)
        post("/bucket/get", emptyMap<String, String>(), cookies.session)
            .expectStatus().isOk
            .expectBody()
            .jsonPath("$.success").isEqualTo(true)
            .jsonPath("$.buckets[0].Name").isEqualTo("b")
    }

    @Test
    fun `the cid cookie alone keeps the user logged in`() {
        val cid = login().cid!!
        client.post().uri("/bucket/get").cookie(SecurityConstants.COOKIE_CID, cid).exchange()
            .expectStatus().isOk
    }

    @Test
    fun `an unknown cid falls through as anonymous instead of an empty 200`() {
        client.get().uri("/auth/check").cookie(SecurityConstants.COOKIE_CID, "stale").exchange()
            .expectStatus().isOk
            .expectBody().jsonPath("$.success").isEqualTo(false)
        client.post().uri("/bucket/get").cookie(SecurityConstants.COOKIE_CID, "stale").exchange()
            .expectStatus().isUnauthorized
    }

    @Test
    fun `listing returns folders first with their recursive totals`() {
        bucket.file("docs/a.txt", "12345")
        bucket.file("z.txt", "1")
        val session = login().session
        post("/object/get", mapOf("bucket" to "b", "path" to ""), session)
            .expectStatus().isOk
            .expectBody()
            .jsonPath("$.objects[0].type").isEqualTo("folder")
            .jsonPath("$.objects[0].name").isEqualTo("docs/")
            .jsonPath("$.objects[0].fileCount").isEqualTo(1)
            .jsonPath("$.objects[0].size").isEqualTo(5)
            .jsonPath("$.objects[1].name").isEqualTo("z.txt")
            .jsonPath("$.objects[1].fileCount").doesNotExist()
    }

    @Test
    fun `a change in a subfolder refreshes the cached ancestor listings`() {
        bucket.file("docs/sub/a.txt", "1")
        val session = login().session
        val root = mapOf("bucket" to "b", "path" to "")
        post("/object/get", root, session).expectBody().jsonPath("$.objects[0].fileCount").isEqualTo(1)

        client.post().uri { it.path("/object/upload").queryParam("bucket", "b").queryParam("path", "docs/sub/").queryParam("filename", "b.txt").build() }
            .cookie("SESSION", session!!)
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .bodyValue("hello".toByteArray())
            .exchange()
            .expectStatus().isOk

        assertEquals("hello", bucket.resolve("docs/sub/b.txt").readText())
        post("/object/get", root, session).expectBody().jsonPath("$.objects[0].fileCount").isEqualTo(2)
    }

    @Test
    fun `an existing folder is a 409 problem detail with a user facing message`() {
        bucket.dir("docs")
        val session = login().session
        post("/object/create", mapOf("bucket" to "b", "path" to "", "foldername" to "docs"), session)
            .expectStatus().isEqualTo(HttpStatus.CONFLICT)
            .expectHeader().contentType(MediaType.APPLICATION_PROBLEM_JSON)
            .expectBody()
            .jsonPath("$.status").isEqualTo(409)
            .jsonPath("$.detail").isEqualTo("폴더가 이미 존재합니다.")
    }

    @Test
    fun `a rejected paste is a 400 problem detail`() {
        bucket.file("a.txt")
        val session = login().session
        val body = mapOf("bucket" to "b", "pathFrom" to "", "pathTo" to "", "objects" to listOf("a.txt"), "mode" to "move")
        post("/object/paste", body, session)
            .expectStatus().isBadRequest
            .expectBody().jsonPath("$.detail").isEqualTo("알 수 없는 붙여넣기 방식입니다: move")
    }

    @Test
    fun `paste conflicts then paste with a resolution`() {
        bucket.file("from/a.txt", "new")
        bucket.file("to/a.txt", "old")
        val session = login().session
        val body = mapOf("bucket" to "b", "pathFrom" to "from/", "pathTo" to "to/", "objects" to listOf("a.txt"), "mode" to "cut")
        post("/object/paste/conflicts", body, session)
            .expectStatus().isOk
            .expectBody()
            .jsonPath("$.conflicts[0].name").isEqualTo("a.txt")
            .jsonPath("$.missing").isEmpty()

        post("/object/paste", body, session).expectStatus().isEqualTo(HttpStatus.CONFLICT)
        post("/object/paste", body + ("resolutions" to mapOf("a.txt" to "overwrite")), session).expectStatus().isOk
        assertEquals("new", bucket.resolve("to/a.txt").readText())
    }

    @Test
    fun `path traversal is a 400`() {
        storageRoot.file("secret/x.txt")
        val session = login().session
        post("/object/get", mapOf("bucket" to "b", "path" to "../secret/"), session).expectStatus().isBadRequest
        post("/object/delete", mapOf("bucket" to "b", "path" to "%2e%2e/", "objects" to listOf("secret/")), session)
            .expectStatus().isBadRequest
        assertTrue(storageRoot.resolve("secret/x.txt").exists())
    }

    @Test
    fun `download reads the form body and sends one file raw`() {
        bucket.file("docs/a.txt", "A")
        val session = login().session
        val form = LinkedMultiValueMap<String, String>().apply {
            add("bucket", "b")
            add("path", "docs/")
            add("filenames", "a.txt")
        }
        client.post().uri("/object/download?dl=1")
            .cookie("SESSION", session!!)
            .body(BodyInserters.fromFormData(form))
            .exchange()
            .expectStatus().isOk
            .expectHeader().valueEquals(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"a.txt\"")
            .expectHeader().valueEquals(HttpHeaders.ACCEPT_RANGES, "bytes")
            .expectBody(String::class.java).isEqualTo("A")
    }

    companion object {
        private const val REDIS_DB = 15
        private const val PASSWORD = "test-password"

        private val storageRoot: Path = Files.createTempDirectory("yong-drive-api-test")

        @JvmStatic
        @DynamicPropertySource
        fun properties(registry: DynamicPropertyRegistry) {
            registry.add("spring.data.redis.database") { REDIS_DB }
            registry.add("app.storage.root") { storageRoot.toString() }
            registry.add("app.auth.password") { BCryptPasswordEncoder().encode(PASSWORD)!! }
        }

        @JvmStatic
        @AfterAll
        fun cleanUp() {
            deleteTree(storageRoot)
        }

        @OptIn(ExperimentalPathApi::class)
        private fun deleteTree(path: Path) {
            path.deleteRecursively()
        }
    }
}
