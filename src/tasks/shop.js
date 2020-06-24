import { findImg } from "@auto.pro/search"
import { switchMap, tap, toArray, repeat, delay } from "rxjs/operators"
import { from, of, concat } from "rxjs"
import { click } from "@auto.pro/action"
import { tag, clickImg, OKBlueBtn$, goMenuHomePage$ } from "@/system"
import { getWidth, getHeight, pausableTimeout } from "@auto.pro/core"

/**
 * 每日购买经验和强化材料
 */
export const dailyShop$ = concat(
    goMenuHomePage$,
    clickImg('assets/副菜单/商店.png').pipe(
        pausableTimeout(3000),
        delay(2000)
    ),
    findImg({
        path: "assets/商店/选项.png",
        option: {
            max: 10
        },
        index: null,
        once: true
    }).pipe(
        tag('每日商店素材', true),
        switchMap(pts => {
            if (pts && pts.length > 0) {
                return from(pts).pipe(
                    tap(pt => click(...pt, [300, 500], 5, 2)),
                    toArray(),
                    switchMap(() => clickImg("assets/littenBlue.png", [
                        getWidth(1 / 2),
                        getHeight(0.77),
                    ])),
                    switchMap(() => OKBlueBtn$.pipe(repeat(2))),
                    toArray()
                )
            } else {
                return of(false)
            }
        }),
    )
).pipe(
    toArray(),
    tag('每日商店素材购买完毕')
)