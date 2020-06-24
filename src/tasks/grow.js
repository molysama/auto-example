// [起号到3-1]

import { specia$ } from "@/specia"
import {
    addBtn,
    blueBtn,
    cancelable$,
    cancelBtn$,
    clickImg,
    closeBtn$,
    goMenuAdventure$,
    goMenuRole$,
    OKBlueBtn$,
    OKWhiteBtn$,
    pausableTimeout,
    pausableTimeoutWith,
    pausableTimer,
    redoable$,
    tag,
} from "@/system"
import { click } from "@auto.pro/action"
import { getHeight, getWidth, scale } from "@auto.pro/core"
import { findImg } from "@auto.pro/search"
import {
    concat,
    from,
    merge,
    of,
    throwError,
    zip,
    iif,
    race,
    defer,
} from "rxjs"
import {
    catchError,
    concatMap,
    delay,
    filter,
    repeat,
    switchMap,
    take,
    takeUntil,
    tap,
    toArray,
} from "rxjs/operators"
import { clickNext$, fight$, intoMap$, singleFight$, sweepsMap } from "./map"
import { recievePresent$, recieveTask$ } from "./recieve"

let addStrengthTimes = 0
export function resetAddStrengthTimes() {
    addStrengthTimes = 0
}
export const addStrength$ = OKBlueBtn$.pipe(
    pausableTimeoutWith(3000, of(null)),
    switchMap((v) => {
        // 如果没有第一个蓝OK，则说明不缺体力，直接返回of(false)
        return iif(
            () => v,
            findImg({
                path: "assets/OK.png",
                option: {
                    region: [getWidth(1 / 3), getHeight(1 / 2)],
                },
            }).pipe(
                pausableTimeoutWith(3000, of(null)),
                // 如果有第二个蓝OK，且回复体力次数小于3，则点击并等待白色OK
                // 否则取消并抛出一个错误
                switchMap((v) => {
                    return iif(
                        () => v && addStrengthTimes < 3,
                        defer(() => {
                            click(...v)
                            addStrengthTimes++
                            return OKWhiteBtn$
                        }),
                        cancelable$.pipe(
                            switchMap(() => throwError("addStrength$ failed"))
                        )
                    )
                })
            ),
            of(false)
        )
    })
)

const growPush$ = concat(
    cancelable$.pipe(
        repeat(),
        pausableTimeoutWith(2000, of(false)),
        toArray(),
    ),
    clickNext$,
    blueBtn(1),
    addStrength$.pipe(
        switchMap((v) => iif(() => v, blueBtn(1), of(false))),
        catchError((err) => {
            console.log("add Strength$ err", err)
            return cancelBtn$.pipe(switchMap(() => throwError(err)))
        })
    ),
    blueBtn(1),
    fight$
).pipe(toArray(), tag("推图结束"))


/**
 * 强化角色
 */
export const autoIntens$ = goMenuRole$.pipe(
    delay(2000),
    // 点击第一张卡片
    tap(() => click(160, 150, [600, 800], 20, 10)),
    delay(3000),
    switchMap(() =>
        clickImg("assets/可执行按钮.png", [
            getWidth(1 / 4),
            getHeight(0.74),
            getWidth(1 / 2),
            getHeight(0.26),
        ]).pipe(
            switchMap(() => merge(OKBlueBtn$, closeBtn$).pipe(take(1))),
            pausableTimeoutWith(5000, of("不可强化")),
            delay(1000),
            tap(() => click(930, 266, [600, 800], 5, 5)),
            delay(1000),
            repeat(5)
        )
    ),
    toArray(),
    tag("强化角色结束")
)
/**
 * 升级Rank
 */
export const autoRank$ = goMenuRole$.pipe(
    delay(2000),
    tap(() => click(160, 150, [600, 800], 20, 10)),
    delay(2000),
    switchMap(() =>
        clickImg("assets/角色/RANK提升.png", [
            0,
            getHeight(1 / 2),
            getWidth(1 / 2),
            getHeight(0.24),
        ]).pipe(
            pausableTimeout(3000),
            switchMap(() =>
                merge(
                    // 不一定有蓝按钮
                    OKBlueBtn$.pipe(pausableTimeout(12000)),
                    pausableTimer(8000).pipe(
                        switchMap(() =>
                            OKWhiteBtn$.pipe(repeat(2), pausableTimeout(3000))
                        )
                    )
                )
            ),
            toArray(),
            catchError((err) => of(false)),
            delay(2000),
            tag("RANK", true),
            tap(() => click(930, 266, [600, 800], 5, 5)),
            delay(1000),
            repeat(5),
        )
    ),
    toArray(),
    tag('升级Rank结束')
)

/**
 * 寻找对应装备
 */
const findEqu$ = zip(
    findImg({
        path: "assets/角色/装备素材左.png",
        option: {
            region: [getWidth(1 / 2), getHeight(1 / 2)],
        },
        useCache: {
            key: "rank-left",
        },
        once: true,
    }),
    findImg({
        path: "assets/角色/装备素材右.png",
        option: {
            region: [getWidth(1 / 2), getHeight(1 / 2)],
        },
        useCache: {
            key: "rank-right",
        },
        once: true,
    }),
    findImg({
        path: "assets/角色/装备素材中.png",
        option: {
            region: [getWidth(1 / 2), getHeight(1 / 2)],
        },
        useCache: {
            key: "rank-middle",
        },
        once: true,
    })
)

/**
 * 找三星图，如果有则进行扫图
 * 如果没有三星图，则找装备素材线
 * 有装备素材线则点进去，并递归findDeepEqu$
 * 没有装备素材线则切换到prev$返回
 * 结束
 */
export const findDeepEqu$ = clickImg(
    "assets/关卡/装备素材关卡箭头.png",
    [getWidth(2 / 3), 0],
    0.9
).pipe(
    pausableTimeoutWith(3000, of(null)),
    switchMap((pt) => {
        const prev$ = findImg({
            path: "assets/角色/橙色下箭头.png",
            option: {
                region: [getWidth(1 / 2), 0, getWidth(1 / 2), getHeight(1 / 3)],
            },
        }).pipe(
            tap((pt) =>
                click(pt[0] - 60 * scale, pt[1] - 60 * scale, [600, 800], 5, 5)
            )
        )

        if (!pt) {
            return findEqu$.pipe(
                switchMap((v) => {
                    if (v[0] === null && v[1] === null && v[2] === null) {
                        return prev$
                    } else {
                        return from(v).pipe(
                            filter((v) => v),
                            concatMap((pt) => {
                                return of(pt).pipe(
                                    tap(() =>
                                        click(
                                            pt[0],
                                            pt[1] + 70 * scale,
                                            [600, 800],
                                            10,
                                            10
                                        )
                                    ),
                                    delay(1000),
                                    switchMap(() => findDeepEqu$)
                                )
                            })
                        )
                    }
                })
            )
        }

        // 如果有关卡箭头，则进行扫荡，结束后回到地图选择状态
        const sweep$ = sweepsMap(5).pipe(
            // 扫荡成功后点击取消返回到地图选择
            switchMap(() => cancelBtn$),
            // 如果无法扫荡，会报错，判断状况
            catchError((err) => {
                if (err === "无法扫荡") {
                    console.log("无法扫荡素材本")
                    return blueBtn(1).pipe(
                        delay(1500),
                        switchMap(() => {
                            // 判断是否存在【我的队伍】标志
                            return findImg({
                                path: "assets/队伍/我的队伍.png",
                                option: {
                                    region: [
                                        getWidth(2 / 3),
                                        0,
                                        getWidth(1 / 3),
                                        getHeight(1 / 3),
                                    ],
                                },
                                once: true,
                            })
                        }),
                        switchMap((v) => {
                            // 如果有我的队伍，则说明是未达成三星，点击蓝色按钮
                            // 随后进入刷图模式
                            // 刷图完毕后会直接回到地图选择页面
                            // 点选地图，redo本sweep$
                            if (v) {
                                return concat(blueBtn(1), singleFight$).pipe(
                                    toArray(),
                                    // 不再redo
                                    // switchMap(() =>
                                    //     clickImg(
                                    //         "assets/关卡/装备素材关卡箭头.png",
                                    //         [getWidth(2 / 3), 0],
                                    //         0.9
                                    //     )
                                    // ),
                                    // tap(() => {
                                    //     redoable$.next(true)
                                    // }),
                                    switchMap(() => of(true)),
                                    catchError((err) => {
                                        // 如果战斗失败了，直接在选择地图页面，无需再次点击取消
                                        if (err === "fight$ lost") {
                                            return of(false)
                                        } else {
                                            return err
                                        }
                                    })
                                )
                            } else {
                                // 否则是缺少体力，先补充体力，然后redo整个sweep$
                                // 如果补充体力失败，直接
                                console.log("补充体力")
                                return addStrength$.pipe(
                                    switchMap((v) => {
                                        if (v) {
                                            redoable$.next(true)
                                            return of(true)
                                        } else {
                                            return throwError("补充体力异常")
                                        }
                                    }),
                                    catchError((err) => {
                                        console.log("sweep$ err", err)
                                        return throwError(err)
                                    })
                                )
                            }
                        })
                    )
                } else {
                    return of(true)
                }
            }),
            toArray()
        )
        return redoable$.pipe(
            switchMap(() => sweep$),
            switchMap(() => prev$),
            take(1)
        )
    }),
    toArray(),
    delay(1000),
    tag("搜集素材结束，回到上一层")
)

/**
 * 自动刷取Rank装备
 */
export const autoFinishRank$ = concat(
    goMenuRole$,
    pausableTimer(1000).pipe(
        tap(() => click(160, 150, [600, 800], 20, 10)),
        delay(2000)
    ),
    findImg({
        path: "assets/角色/可以获得.png",
        option: {
            region: [0, 0, getWidth(1 / 2), getHeight(4 / 5)],
        },
        once: true,
        index: null,
    }).pipe(
        tag("可以获得", true),
        switchMap((pts) => from(pts)),
        concatMap((pt) => {
            if (!pt) {
                return of(pt)
            }
            return of(pt).pipe(
                tap((pt) => click(...pt, [600, 800], 10, 5)),
                switchMap(() =>
                    concat(
                        cancelable$,
                        findDeepEqu$,
                        pausableTimer(1000),
                        clickImg("assets/取消.png", [
                            0,
                            getHeight(3 / 4),
                            getWidth(1 / 2),
                            getHeight(1 / 4),
                        ])
                    )
                ),
                toArray()
            )
        }),
        toArray(),
        tap(() => click(930, 266, [600, 800], 5, 5)),
        delay(2000),
        repeat(5),
        takeUntil(
            specia$.pipe(
                filter((v) => v !== "instruct"),
                take(1)
            )
        ),
        catchError((err) => {
            console.log("搜集素材时出错", err)
            return cancelBtn$.pipe(
                repeat(),
                pausableTimeout(3000, of(false)),
                toArray()
            )
        })
    )
)


const growPushFromMenu = (ob = of(true), times) =>
    concat(goMenuAdventure$, intoMap$).pipe(
        toArray(),
        switchMap(() =>
            growPush$.pipe(
                repeat(times),
                delay(1000),
                takeUntil(
                    // 出现大箭头或剧情，则本轮推图结束
                    specia$.pipe(
                        filter((v) => v !== "instruct"),
                        tag("强制结束推图")
                    )
                )
            )
        ),
        toArray(),
        concatMap((v) => {
            return ob
        }),
        repeat(),
        toArray(),
        catchError((err) => {
            console.log("growPushFromMenu$ err", err)
            return throwError(err)
        })
    )

export const grow$ = growPushFromMenu()
    .pipe(catchError((err) => of(true)))

// 目前的卡点，第一个剧情的视频
// 搜集Rank时没体力扫荡
// 领取任务奖励时有可能升级
