// NEXT click
// 挑战 click
// 战斗开始 click
// 出现右上角队伍图标/下一步蓝色按钮
// 有可能出现限定商店，找取消按钮并点击
// blue，close click
// 出现NEXT

import { switchMap, concatMap } from "rxjs/operators"
import { clickImg, goMenuAdventure$ } from "@/system"
import { getWidth, getHeight } from "@auto.pro/core"
import { generate } from "rxjs"
import { pushMap } from "./map"

export const chuyin = goMenuAdventure$.pipe(
    switchMap(() =>
        clickImg("assets/活动/初音入口.png", [
            getWidth(1 / 3),
            getHeight(1 / 2),
            getWidth(1 / 3),
            getHeight(1 / 2),
        ])
    ),
    switchMap(() => {
        return generate(
            1,
            (x) => x <= 15,
            (x) => x + 1
        ).pipe(concatMap(() => pushMap()))
    })
)
