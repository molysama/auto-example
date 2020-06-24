import { pauseSpecia, resumeSpecia, pauseArrow } from "@/specia"
import {
    backBtn$,
    blueBtn,
    cancelBtn$,
    clickImg,
    clickImgWithCheck,
    goMenuAdventure$,
    OKBlueBtn$,
    pausableTimeout,
    pausableTimeoutWith,
    pausableTimer,
    redoable$,
    tag,
    OKWhiteBtn$,
    log2Html,
} from "@/system"
import { getHeight, getWidth, pauseState$, scale } from "@auto.pro/core"
import { findImg } from "@auto.pro/search"
import { concat, defer, merge, of, range, throwError, timer } from "rxjs"
import {
    catchError,
    concatMap,
    delay,
    filter,
    map,
    repeat,
    switchMap,
    take,
    takeUntil,
    tap,
    toArray,
    retry,
} from "rxjs/operators"
import { swipe } from "@auto.pro/action"

export const dnfFight = (index = 1, mapType = "密林") =>
    concat(
        clickImgWithCheck(`assets/地下城/${mapType}${index}.png`, [
            0,
            0,
            getWidth(),
            400 * scale,
        ], 0.9, 1000, false).pipe(pausableTimeout(6000)),
        blueBtn(1),
        defer(() => {
            if (index === 1) {
                return concat(
                    clickImg("assets/队伍/支援.png").pipe(
                        switchMap(() =>
                            findImg({
                                path: "assets/队伍/支援.png",
                                option: {
                                    region: [
                                        0,
                                        0,
                                        getWidth(1),
                                        getHeight(1 / 3),
                                    ],
                                },
                                once: true,
                            })
                        ),
                        switchMap((v) => {
                            if (v) {
                                return concat(
                                    cancelBtn$,
                                    cancelBtn$,
                                    backBtn$
                                ).pipe(
                                    toArray(),
                                    switchMap(() => throwError("end"))
                                )
                            } else {
                                return of(true)
                            }
                        })
                    ),
                    clickImg("assets/队伍/血条.png").pipe(
                        pausableTimeout(3000),
                        catchError(err => {
                            // 如果找不到血条，则进行一次滑动
                            swipe([460, 320], [470, 170], 300)
                            return pausableTimer(1000).pipe(
                                switchMap(() => throwError(err))
                            )
                        }),
                        retry(1),
                        catchError(err => cancelBtn$.pipe(switchMap(() => throwError('end'))))
                    ),
                    clickImg("assets/队伍/全部.png"),
                    clickImg("assets/队伍/血条.png").pipe(repeat(4))
                ).pipe(toArray())
            } else if (mapType === "云海" && index > 3) {
                // 云海不用打boss
                return cancelBtn$.pipe(
                    switchMap(() => cancelBtn$),
                    switchMap(() =>
                        clickImg("assets/地下城/撤退.png", [
                            getWidth(1 / 2),
                            getHeight(1 / 2),
                        ])
                    ),
                    switchMap(() => OKBlueBtn$),
                    delay(3000),
                    switchMap(() => throwError("end"))
                )
            } else {
                return of(true)
            }
        }).pipe(
            tap(() => {
                resumeSpecia()
            })
        ),
        blueBtn(9).pipe(takeUntil(OKWhiteBtn$)),
        pausableTimer(1000)
    ).pipe(
        toArray(),
        catchError((err) => {
            console.log(`dnfFight ${mapType}${index} err`, err)
            if (err === "end") {
                return throwError(err)
            } else {
                log2Html('dnfFight出错', err)
                return of(true)
            }
        })
    )

function chooseDnf(index = 1) {
    let mapType = {
        1: "云海",
        2: "密林",
    }[index]

    return clickImg(`assets/地下城/${mapType}.png`).pipe(
        pausableTimeoutWith(3000, of(null)),
        delay(3000),
        switchMap((v) => {
            if (!v) {
                return of(null)
            }

            // 检查是否还有相关的关卡图标，有的话直接结束
            // 没有的话检查blue按钮
            return findImg({
                path: `assets/地下城/${mapType}.png`,
                once: true,
            }).pipe(
                switchMap((v) => {
                    if (v) {
                        return throwError("done")
                    } else {
                        return blueBtn(1).pipe(
                            pausableTimeoutWith(2000, of(null))
                        )
                    }
                })
            )
        }),
        toArray(),
        switchMap(() =>
            range(1, 10).pipe(
                concatMap((index) =>
                    dnfFight(index, mapType).pipe(map(() => index))
                ),
            )
        )
    )
}

/**
 * 地下城
 */
export const dnf$ = defer(() => {
    const main$ = concat(
        goMenuAdventure$,
        clickImgWithCheck("assets/冒险_地下城.png", [getWidth(1 / 2), 0]).pipe(
            pausableTimeout(5000)
        ),
        merge(
            chooseDnf(1),
            // 监听特殊状态，如果出现则重做整个dnf$
            // 由于一开始会强制关闭specia，因此不会被1关的大箭头影响
            pauseState$.pipe(
                filter((v) => v),
                take(1),
                tap(() => redoable$.next(true))
            )
        ),
        pausableTimer(2000),
        backBtn$
    ).pipe(
        catchError((err) => {
            console.log("dnf err", err)
            return of(true)
        }),
        toArray()
    )

    return redoable$.pipe(
        switchMap(() => main$),
        take(1),
        tag('地下城结束')
    )
})
