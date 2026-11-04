package com.abcworld.yongdrive.dto.request

data class PasteRequest(
    val bucket: String = "",
    val bucketTo: String = "",
    val pathFrom: String = "",
    val pathTo: String = "",
    val objects: List<String> = emptyList(),
    val mode: String = MODE_COPY,
    val resolutions: Map<String, String> = emptyMap(),
) {
    companion object {
        const val MODE_COPY = "copy"
        const val MODE_CUT = "cut"

        const val RESOLVE_OVERWRITE = "overwrite"
        const val RESOLVE_SKIP = "skip"
        const val RESOLVE_RENAME = "rename"
    }
}
