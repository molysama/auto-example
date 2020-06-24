import {
    blueBtn,
    cancelable$,
    clickImg,
    closeBtn$,
    goMenuHomePage$,
    pausableTimeoutWith,
    clickImgWithCheck,
    tag,
    pausableTimeout,
} from "@/system"
import { getHeight, getWidth } from "@auto.pro/core"
import { concat, defer, of } from "rxjs"
import { repeat, switchMap, toArray, tap, catchError } from "rxjs/operators"

export const recieveTask$ = defer(() => {
    return goMenuHomePage$.pipe(
        tap(() => console.log("开始 --- 接收任务奖励")),
        switchMap(() =>
            clickImgWithCheck("assets/副菜单/任务.png", [
                getWidth(1 / 2),
                getHeight(1 / 2),
            ]).pipe(pausableTimeout(5000))
        ),
        switchMap(() =>
            concat(
                clickImg("assets/可执行按钮.png", [
                    getWidth(1 / 2),
                    getHeight(0.7),
                ]),
                closeBtn$.pipe(repeat())
            ).pipe(pausableTimeoutWith(3000, of(false)))
        ),
        toArray(),
        catchError((err) => of(false)),
        tag("结束 --- 接收任务奖励")
    )
})

export const recievePresent$ = goMenuHomePage$.pipe(
    tag("开始 --- 接收礼物"),
    switchMap(() =>
        clickImgWithCheck("assets/副菜单/礼物.png", [
            getWidth(1 / 2),
            getHeight(1 / 2),
        ]).pipe(pausableTimeout(5000))
    ),
    switchMap(() =>
        concat(
            clickImg("assets/可执行按钮.png", [
                getWidth(1 / 2),
                getHeight(0.7),
            ]),
            blueBtn(1),
            clickImg("assets/OK_WHITE.png", [
                getWidth(1 / 3),
                getHeight(1 / 2),
            ]),
            cancelable$
        ).pipe(pausableTimeoutWith(3000, cancelable$), toArray())
    ),
    toArray(),
    catchError((err) => of(false)),
    tag("结束 --- 接收礼物")
)
