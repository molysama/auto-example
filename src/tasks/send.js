import {
    clickImg,
    goMenuHomePage$,
    blueBtn,
    cancelable$,
    clickImgWithCheck,
    tag,
    pausableTimer,
    pausableTimeout,
    pausableTimeoutWith,
} from "@/system"
import { getHeight, getWidth, scale } from "@auto.pro/core"
import { concat, range, of, throwError } from "rxjs"
import {
    concatMap,
    switchMap,
    catchError,
    toArray,
    delay,
    tap,
} from "rxjs/operators"
import { findImg } from "@auto.pro/search"
import { click } from "@auto.pro/action"

export const ensureHasBeenMember$ = clickImg("assets/行会/设定.png", [
    getWidth(4 / 5),
    0,
    getWidth(1 / 5),
    getHeight(1 / 3),
]).pipe(
    pausableTimeoutWith(3000, of(null)),
    switchMap((pt) => {
        // 如果有设定按钮，说明还没加入公会，进行加入公会流程
        if (pt) {
            return clickImg("assets/行会/请输入行会名.png").pipe(
                delay(1000),
                tap(() => {
                    // Text("MOONCELL-A")
                    Text("MOONCELLER")
                    console.log("input text")
                }),
                tap((pt) => {
                    log(
                        "click",
                        click(pt[0], pt[1] + 30 * scale, [600, 800], 10, 2)
                    )
                }),
                switchMap(() =>
                    concat(
                        blueBtn(1),
                        pausableTimer(3000),
                        // clickImg("assets/行会/MOONCELL.png"),
                        clickImg("assets/行会/MOONCELLER.png"),
                        blueBtn(3)
                    )
                ),
                toArray()
            )
        } else {
            return of(true)
        }
    })
)

export const send$ = goMenuHomePage$.pipe(
    tag('开始 --- 捐赠装备'),
    switchMap(() =>
        clickImgWithCheck("assets/副菜单/行会.png", [
            getWidth(1 / 2),
            getHeight(2 / 3),
        ]).pipe(pausableTimeout(5000), delay(3000))
    ),
    switchMap(() => ensureHasBeenMember$),
    switchMap(() =>
        range(0, 3).pipe(
            concatMap(() =>
                concat(
                    clickImg("assets/副菜单/行会_宝箱.png", [
                        getWidth(1 / 4),
                        0,
                        getWidth(1 / 2),
                        getHeight(1 / 2),
                    ]),
                    clickImg("assets/littenBlue.png", [
                        getWidth(1 / 2),
                        getHeight(1 / 2),
                    ]),
                    clickImg("assets/littenBlue.png", [
                        getWidth(1 / 2),
                        getHeight(1 / 2),
                    ]),
                    blueBtn(1),
                    cancelable$
                ).pipe(pausableTimeout(7000))
            )
        )
    ),
    catchError((err) => goMenuHomePage$),
    toArray(),
    tag("结束 --- 捐赠装备")
)
