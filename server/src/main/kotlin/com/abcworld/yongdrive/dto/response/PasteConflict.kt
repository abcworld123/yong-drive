package com.abcworld.yongdrive.dto.response

import com.abcworld.yongdrive.entity.ObjectInfo

data class PasteConflict(
    val name: String,
    val src: ObjectInfo,
    val dst: ObjectInfo,
)
