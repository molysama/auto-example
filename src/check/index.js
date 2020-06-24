import {
    clickImg,
    closeBtn$,
    pausableTimeoutWith,
    REGION_MIDDLE, tag
} from "@/system"
import { merge, of } from "rxjs"
import { repeat } from "rxjs/operators"

/**
 * 检查是否有升级
 */
export const checkLevelUP$ = merge(
    clickImg("assets/取消.png", REGION_MIDDLE).pipe(repeat()),
    closeBtn$.pipe(repeat())
).pipe(pausableTimeoutWith(5000, of(false).pipe(tag("checkEnd$"))))
