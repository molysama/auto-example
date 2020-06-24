import { blueBtn, closeBtn$, tag, clickImg } from "@/system"
import { click } from "@auto.pro/action"
import {
    getHeight,
    getWidth,
    pause,
    scale,
    pausableInterval,
} from "@auto.pro/core"
import { findImg } from "@auto.pro/search"
import { defer, interval, merge, of, using, throwError, timer, NEVER, EMPTY } from "rxjs"
import {
    catchError,
    delay,
    exhaustMap,
    filter,
    finalize,
    mapTo,
    pairwise,
    share,
    switchMap,
    takeUntil,
    tap,
    timeoutWith,
    retry,
    timeout,
    take,
    map,
} from "rxjs/operators"

let isPauseInstruct = false
let isPauseRead = false
let isPauseArrow = false
/**
 * 暂停特殊状态的监听
 */
export function pauseSpecia() {
    isPauseInstruct = true
    isPauseRead = true
    isPauseArrow = true
    console.log("pauseSpecia")
}
/**
 * 恢复特殊状态的监听
 */
export function resumeSpecia() {
    isPauseInstruct = false
    isPauseRead = false
    isPauseArrow = false
    console.log("resumeSpecia")
}

export function pauseArrow() {
    isPauseArrow = true
}

/**
 * 监听说明
 */
export const instruct$ = findImg({
    path: "assets/特殊状态/人物名称栏.png",
    eachTime: 3000,
    option: {
        region: [0, getHeight(1 / 2), getWidth(1 / 2), getHeight(1 / 2)],
        threshold: 0.9,
    },
    take: 999999,
    isPausable: false,
}).pipe(
    filter(() => !isPauseInstruct),
    exhaustMap((pt) => {
        pause()
        click(...pt)
        return findImg({
            path: "assets/特殊状态/人物名称栏.png",
            option: {
                region: [
                    0,
                    getHeight(1 / 2),
                    getWidth(1 / 2),
                    getHeight(1 / 2),
                ],
                threshold: 0.9,
            },
            take: 999999,
            isPausable: false,
        }).pipe(
            tap((pt) => click(...pt, [600, 800], 10, 5)),
            timeoutWith(3000, of(true)),
            mapTo("instruct")
        )
    })
)

/**
 * 监听剧情
 */
export const readable$ = findImg({
    take: 999999,
    eachTime: 3000,
    path: "assets/特殊状态/剧情菜单.png",
    option: {
        region: [getWidth(4 / 5), 0, getWidth(1 / 5), getHeight(1 / 5)],
    },
    useCache: {
        key: "剧情菜单",
    },
    isPausable: false,
}).pipe(
    filter(() => !isPauseRead),
    exhaustMap((pt) => {
        const passRead$ = defer(() => {
            pause()
            console.log("出现剧情", pt)
            click(...pt)
            sleep(1000)
            return findImg({
                path: "assets/特殊状态/剧情菜单_跳过.png",
                option: {
                    region: [getWidth(2 / 3), 0, getWidth(1 / 3), getHeight(1 / 5)],
                },
                useCache: {
                    key: "剧情菜单跳过",
                },
                isPausable: false,
            })
        }).pipe(
            tap((pt) => {
                click(...pt)
                console.log('剧情菜单_跳过', pt)
            }),
            delay(1000),
            switchMap(() => blueBtn(1, false)),
            timeout(5000),
            retry(1),
            delay(2000),
            switchMap(() =>
                // 如果有底部菜单按钮则直接结束
                // 没有则点击一次屏幕后查找蓝色按钮，没有蓝色按钮则结束
                findImg({
                    path: "assets/底部主菜单.png",
                    option: {
                        region: [getWidth(4 / 5), getHeight(0.74)],
                    },
                    once: true,
                    isPausable: false,
                }).pipe(
                    switchMap((v) => {
                        if (v) {
                            return of(true)
                        } else {
                            return defer(() => {
                                click(
                                    getWidth(1 / 5),
                                    getHeight(1 / 2),
                                    [600, 800],
                                    10,
                                    20
                                )
                                return blueBtn(1, false)
                            }).pipe(timeoutWith(4000, of(true)))
                        }
                    })
                )
            ),
            catchError(() => of(null))
        )
        return interval(1000).pipe(
            takeUntil(passRead$),
            finalize(() => console.log("剧情结束"))
        )
    }),
    catchError((err) => of(null)),
    mapTo("readable")
)

/**
 * 监听黄色大箭头指导
 */
export const downArrow$ = findImg({
    path: "assets/特殊状态/向下大箭头.png",
    take: 999999,
    isPausable: false,
    eachTime: 3000,
}).pipe(
    filter(() => !isPauseArrow),
    exhaustMap(pt => {
        return findImg({
            path: 'assets/地下城/撤退.png',
            option: {
                region: [getWidth(1 / 2), getHeight(1 / 2)]
            },
            useCache: {
                key: 'arrow-withdrawn'
            },
            isPausable: false,
            valid: 5,
            once: true
        }).pipe(
            map(hasWithdrwan => [pt, hasWithdrwan])
        )
    }),
    exhaustMap(([arrow, hasWithdrawn]) => {
        console.log('hasWithdrawn', hasWithdrawn)
        if (hasWithdrawn) {
            return EMPTY
        }
        pause()
        // 黄色大箭头出现后要监听下载状态
        const arrow$ = using(
            // 监听蓝色按钮
            () => merge(blueBtn(99, false), findImg({ path: 'assets/关闭.png', option: { region: [0, getHeight(1 / 2)] }, isPausable: false }).pipe(tap(pt => click(...pt)))).subscribe(),
            () =>
                findImg({
                    path: "assets/特殊状态/向下大箭头.png",
                    take: 999999,
                    isPausable: false,
                })
        ).pipe(
            exhaustMap(pt => {
                return findImg({
                    path: 'assets/地下城/撤退.png',
                    option: {
                        region: [getWidth(1 / 2), getHeight(1 / 2)]
                    },
                    useCache: {
                        key: 'arrow-withdrawn'
                    },
                    once: true,
                    valid: 5,
                    isPausable: false
                }).pipe(
                    filter(v => !v),
                    map(() => pt)
                )
            }),
            tap((pt) => {
                click(pt[0], pt[1] + 100 * scale, [600, 800], 10, 5)
            }),
            pairwise(),
            tap(([pt1, pt2]) => {
                if (pt1[0] === pt2[0] && pt1[1] - pt2[1] <= 10) {
                    let y = Math.random()
                    y = y > 0.5 ? 150 : 50
                    click(pt1[0], pt1[1] + y * scale, [600, 800], 10, 5)
                }
            }),
        )
        return arrow$.pipe(
            switchMap((v) =>
                merge(
                    // 每个黄色大箭头都维持5秒暂停状态
                    timer(0, 1000).pipe(
                        take(6),
                    ),
                    // 如果发现加载中，则维持10秒pause状态
                    findImg({
                        eachTime: 2000,
                        path: "assets/特殊状态/下载中.png",
                        option: {
                            region: [
                                0,
                                getHeight(0.8),
                                getWidth(1 / 4),
                                getHeight(0.2),
                            ],
                        },
                        isPausable: false,
                        take: 99
                    }).pipe(
                        switchMap(() => interval(1000).pipe(take(10))),
                        timeoutWith(6000, of(true))
                    )
                )
            ),
            timeoutWith(5000, of(true))
        )
    })
)

export const specia$ = merge(readable$, instruct$, downArrow$).pipe(share())
