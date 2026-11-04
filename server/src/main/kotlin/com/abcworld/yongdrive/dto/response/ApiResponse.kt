package com.abcworld.yongdrive.dto.response

import com.abcworld.yongdrive.entity.BucketInfo
import com.abcworld.yongdrive.entity.ObjectInfo
import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ApiResponse(
    val success: Boolean,
    val buckets: List<BucketInfo>? = null,
    val objects: List<ObjectInfo>? = null,
    val conflicts: List<PasteConflict>? = null,
    val missing: List<String>? = null,
) {
    companion object {
        fun success(): ApiResponse = ApiResponse(success = true)
        fun buckets(buckets: List<BucketInfo>): ApiResponse =
            ApiResponse(success = true, buckets = buckets)
        fun objects(objects: List<ObjectInfo>): ApiResponse =
            ApiResponse(success = true, objects = objects)
        fun pasteCheck(conflicts: List<PasteConflict>, missing: List<String>): ApiResponse {
            return ApiResponse(success = true, conflicts = conflicts, missing = missing)
        }
    }
}
