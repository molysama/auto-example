import {
    clickImg,
    clickImgWithCheck,
    goMenuAdventure$,
    addBtn,
    blueBtn,
    cancelable$,
    backBtn$,
    closeBtn$,
    tag,
    pausableTimeout,
    pausableTimeoutWith,
    pausableTimer,
    bottomBlue,
    cancelBtn$,
} from "@/system"
import { getHeight, getWidth } from "@auto.pro/core"
import { concat, defer, of } from "rxjs"
import {
    catchError,
    delay,
    switchMap,
    toArray,
    concatMap,
} from "rxjs/operators"
import { sweepsMap, singleFight$ } from "./map"
import { findImg } from "@auto.pro/search"

export const discover$ = defer(() => {
    const doIt$ = defer(() =>
        concat(
            clickImg("assets/探索/关卡右箭头标志.png", [getWidth(3 / 4), 0]),
            addBtn(1).pipe(pausableTimeout(3000)),
            blueBtn(1),
            clickImg("assets/OK.png", [getWidth(1 / 3), getHeight(1 / 2)])
        ).pipe(
            toArray(),
            delay(1000),
            switchMap(() => blueBtn(1)),
            catchError((err) => {
                console.log("err", err)
                return bottomBlue(1).pipe(
                    pausableTimeoutWith(2000, of(null)),
                    switchMap((v) => {
                        if (v) {
                            return bottomBlue(1).pipe(
                                switchMap(() =>
                                    singleFight$.pipe(
                                        catchError((err) => {
                                            console.log(
                                                "discover singleFight$ err",
                                                err
                                            )
                                            return of(false)
                                        })
                                    )
                                ),
                                toArray(),
                                switchMap(() =>
                                    clickImg("assets/探索/关卡右箭头标志.png", [
                                        getWidth(3 / 4),
                                        0,
                                    ]).pipe(
                                        pausableTimeoutWith(3000, of(false)),
                                        delay(1000),
                                        switchMap((v) => {
                                            if (v) {
                                                return concat(cancelBtn$, backBtn$)
                                            } else {
                                                return of(true)
                                            }
                                        })
                                    )
                                )
                            )
                        } else {
                            return concat(cancelable$, backBtn$)
                        }
                    })
                )
            }),
            toArray(),
            delay(1000)
        )
    )

    return goMenuAdventure$.pipe(
        switchMap(() =>
            clickImgWithCheck("assets/冒险_探索.png", [
                getWidth(1 / 2),
                0,
            ]).pipe(pausableTimeout(5000))
        ),
        delay(1000),
        switchMap(() =>
            concat(
                clickImg("assets/探索/玛那关卡.png", [
                    getWidth(1 / 2),
                    0,
                    getWidth(1 / 2),
                    getHeight(1 / 2),
                ]).pipe(
                    delay(1200),
                    switchMap(() => doIt$),
                    tag('玛那关卡完成')
                ),
                clickImg("assets/探索/经验值关卡.png", [
                    getWidth(1 / 2),
                    0,
                    getWidth(1 / 2),
                    getHeight(1 / 2),
                ]).pipe(
                    delay(1200),
                    switchMap(() => doIt$),
                    tag('经验值关卡完成')
                )
            )
        ),
        catchError((err) => of(false)),
        toArray(),
        tag("探索结束")
    )
})
