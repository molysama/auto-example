import { instruct$ } from "@/specia"
import {
    addBtn,
    blueBtn,
    bottomBlue,
    cancelable$,
    cancelBtn$,
    clickImg,
    clickImgWithCheck,
    goMenuAdventure$,
    OKBlueBtn$,
    OKWhiteBtn$,
    pausableInterval,
    pausableTimeout,
    pausableTimeoutWith,
    pausableTimer,
    tag,
    closeBtn$,
} from "@/system"
import { click } from "@auto.pro/action"
import { cap, getHeight, getWidth, scale } from "@auto.pro/core"
import { findImg } from "@auto.pro/search"
import { concat, from, merge, of, throwError, using } from "rxjs"
import {
    catchError,
    delay,
    exhaustMap,
    max,
    repeat,
    retry,
    switchMap,
    takeWhile,
    tap,
    toArray,
} from "rxjs/operators"
import { checkLevelUP$ } from "@/check"

export const hasFailed$ = findImg({
    path: "assets/关卡/失败标志.png",
    option: {
        region: [
            getWidth(1 / 3),
            getHeight(1 / 2),
            getWidth(2 / 3),
            getHeight(1 / 2),
        ],
    },
    once: true,
    useCache: {
        key: "has-failed",
    },
})

// 等待战斗结束
// 战斗结束时必然会出现一个蓝色按钮【下一步】，点击
// 1. 有可能出现好感升级，当右上角有跳过按钮时，跳过
// 2. 有可能出现限定商店，先查看是否有【取消】按钮，有的话点击
// 3. 继续点击蓝色按钮【下一步】，回到地图界面
// 4. 有可能弹出对话框，点击可取消按钮

export const intoMap$ = using(
    () => merge(blueBtn(1), cancelable$).subscribe(),
    () =>
        clickImgWithCheck("assets/冒险_主线关卡.png", [
            getWidth(1 / 2),
            0,
            getWidth(1 / 2),
            getHeight(2 / 3),
        ])
).pipe(
    delay(2000),
    // 检查关闭按钮和关卡类型
    switchMap(() =>
        concat(
            cancelable$.pipe(repeat(), pausableTimeoutWith(2000, of(true))),
            clickImg("assets/关卡/NORMAL_UNACTIVE.png", [
                getWidth(1 / 2),
                0,
                getWidth(1 / 2),
                getHeight(1 / 2),
            ]).pipe(pausableTimeoutWith(2000, of(true))),
            pausableInterval(3000).pipe(
                exhaustMap(() => {
                    let hasNextMap = images.detectsColor(
                        cap(),
                        "#f7f7f7",
                        935 * scale,
                        getHeight(1 / 2)
                    )
                    hasNextMap =
                        hasNextMap ||
                        images.detectsColor(
                            cap(),
                            "#f7f7f7",
                            935 * scale,
                            getHeight(1 / 2)
                        )
                    hasNextMap =
                        hasNextMap ||
                        images.detectsColor(
                            cap(),
                            "#f7f7f7",
                            935 * scale,
                            getHeight(1 / 2)
                        )
                    if (hasNextMap) {
                        click(935 * scale, getHeight(1 / 2))
                        return of(hasNextMap).pipe(delay(3000))
                    } else {
                        return of(hasNextMap)
                    }
                }),
                takeWhile((v) => v)
            )
        )
    ),
    toArray(),
    tag("进入地图结束")
)

export const hasNormalBtn$ = findImg({
    path: "assets/关卡/NORMAL_ACTIVE.png",
    option: {
        region: [getWidth(1 / 2), 0, getWidth(1 / 2), getHeight(1 / 3)],
    },
    once: true,
})

export const fight$ = using(
    // 跳过升级和好感升级
    () =>
        merge(
            // 好感
            pausableInterval(1000).pipe(
                exhaustMap(() => clickImg("assets/签到跳过.png"))
            ),
            // 升级
            OKWhiteBtn$,
            pausableTimer(7000).pipe(
                switchMap(() =>
                    merge(
                        clickImg("assets/关卡/AUTO_WHITE.png", [
                            getWidth(4 / 5),
                            getHeight(2 / 3),
                        ]),
                        clickImg("assets/关卡/SPEED_WHITE.png", [
                            getWidth(4 / 5),
                            getHeight(2 / 3),
                        ])
                    )
                ),
                pausableTimeoutWith(12000, of(null))
            )
        ).subscribe(),
    () =>
        pausableTimer(5000).pipe(
            switchMap(() =>
                findImg({
                    path: "assets/可执行按钮.png",
                    option: {
                        region: [getWidth(1 / 2), getHeight(0.74)],
                        threshold: 0.9,
                    },
                    eachTime: 2000,
                }).pipe(tap((pt) => console.log("fight$ find blueBtn", pt)))
            )
        )
).pipe(
    delay(1000),
    switchMap(() => hasFailed$),
    switchMap((v) => {
        console.log("hasFailed", v)
        if (v) {
            return blueBtn(1).pipe(switchMap(() => throwError("fight$ lost")))
        } else {
            return concat(
                bottomBlue(1),
                cancelBtn$.pipe(pausableTimeoutWith(4000, of(true))),
                bottomBlue(1).pipe(delay(4000)),
                // clickImg("assets/取消.png", [
                //     getWidth(0.27),
                //     getHeight(1 / 2),
                //     getWidth(0.34),
                //     getHeight(1 / 2),
                // ]).pipe(repeat(), pausableTimeoutWith(3000, of(true)))
                checkLevelUP$
            ).pipe(toArray())
        }
    }),
    // switchMap(() =>
    //     // 一直寻找关闭按钮，超过5秒没有关闭按钮则此轮战斗结束
    //     pausableInterval(500).pipe(
    //         exhaustMap(() => cancelable$),
    //         pausableTimeoutWith(3000, of(true))
    //     )
    // ),
    toArray(),
    tag("战斗结束"),
    catchError((err) => {
        console.log("fight$ err", err)
        return throwError(err)
    })
)

export const singleFight$ = using(
    // 跳过升级和好感升级
    () =>
        merge(
            pausableInterval(1000).pipe(
                exhaustMap(() => clickImg("assets/签到跳过.png"))
            ),
            instruct$,
            OKWhiteBtn$
        ).subscribe(),
    () =>
        pausableTimer(5000).pipe(
            switchMap(() =>
                findImg({
                    path: "assets/可执行按钮.png",
                    option: {
                        region: [getWidth(1 / 2), getHeight(0.74)],
                        threshold: 0.9,
                    },
                    eachTime: 2000,
                }).pipe(tap((pt) => console.log("fight$ find blueBtn", pt)))
            )
        )
).pipe(
    delay(1000),
    switchMap(() => hasFailed$),
    switchMap((v) => {
        console.log("hasFailed", v)
        if (v) {
            return bottomBlue(1).pipe(
                tag("战斗失败"),
                switchMap(() => throwError("fight$ lost"))
            )
        } else {
            return concat(
                bottomBlue(1),
                cancelBtn$.pipe(repeat(), pausableTimeoutWith(4000, of(true))),
                bottomBlue(1).pipe(delay(4000)),
                checkLevelUP$
                // merge(
                //     clickImg("assets/取消.png", [
                //         getWidth(0.27),
                //         getHeight(1 / 2),
                //         getWidth(0.34),
                //         getHeight(1 / 2),
                //     ]).pipe(repeat(), pausableTimeoutWith(3000, of(true))),
                //     closeBtn$.pipe(
                //         repeat(),
                //         pausableTimeoutWith(3000, of(true))
                //     )
                // )
            )
        }
    }),
    toArray(),
    tap(() => console.log("singleFight$ end"))
)

export function findNEXT() {
    return findImg({
        path: "assets/关卡/NEXT-TRUE.png",
        option: {
            transparentMask: true,
            threshold: 0.85,
            max: 1,
            region: [0, 0],
        },
        valid: 0,
    }).pipe(tag("NEXT坐标", true), delay(1000))
}

/**
 * 点击NEXT，进入对应关卡
 */
export const clickNext$ = findNEXT().pipe(
    tap((pt) => {
        log("clickNext", click(pt[0], pt[1] + 100 * scale))
    }),
    switchMap((pt) => {
        return findImg({
            path: "assets/可执行按钮.png",
            option: {
                region: [getWidth(1 / 2), getHeight(0.7)],
            },
        }).pipe(
            pausableTimeoutWith(2000, of(null)),
            tap((btnPt) => {
                // 如果没有可执行按钮，说明还没进入挑战页面，在刚才pt的基础上往下方点击
                if (!btnPt) {
                    click(pt[0], pt[1] + 50 * scale)
                    // 并抛出一个报错
                    throw "还没进入挑战页面"
                }
            }),
            retry(1),
            delay(1000)
        )
    }),
    retry(3)
)

export const singleMap$ = findImg({
    path: "assets/可执行按钮.png",
    option: {
        region: [getWidth(1 / 2), getHeight(0.7)],
    },
}).pipe(
    // 点击挑战按钮
    tap((pt) => click(...pt, [600, 800], 10, 5)),
    // 有可能体力不足
    switchMap((pt) =>
        // 恢复体力，执行蓝OK-蓝OK-白OK，结束后再点击一次pt(挑战按钮位置)
        concat(OKBlueBtn$, OKBlueBtn$, OKWhiteBtn$).pipe(
            pausableTimeout(3000),
            toArray(),
            tap((pt) => click(...pt, [600, 800], 10, 5)),
            // 如果未出现蓝OK，则说明已进入选择队伍页面
            catchError((err) => of(true))
        )
    ),
    switchMap(() => blueBtn(1)),
    delay(10000),
    // 进入战斗
    switchMap(() => singleFight$),
    toArray()
)

export const checkEnd$ = merge(
    OKWhiteBtn$.pipe(repeat()),
    clickImg("assets/取消.png", [
        0,
        getHeight(1 / 2),
        getWidth(1 / 2),
        getHeight(1 / 2),
    ]).pipe(repeat()),
    closeBtn$.pipe(repeat())
).pipe(pausableTimeoutWith(5000, of(false).pipe(tag("检查扫荡结果"))))

/**
 * 扫荡地图
 *
 * 如果能使用扫荡券，则增加times张扫荡券后点击【使用N张】按钮
 * 蓝OK-白OK-
 *
 */
export const sweepsMap = (addTimes) =>
    concat(
        findImg({
            path: "assets/可执行按钮.png",
            option: {
                region: [
                    getWidth(1 / 2),
                    getHeight(1 / 2),
                    getWidth(1 / 2),
                    getHeight(0.24),
                ],
            },
        }).pipe(pausableTimeout(3000)),
        addBtn(addTimes).pipe(
            pausableTimeoutWith(3000, of(true)),
            toArray(),
            delay(1000)
        ),
        clickImg("assets/可执行按钮.png", [
            getWidth(1 / 2),
            getHeight(1 / 2),
            getWidth(1 / 2),
            getHeight(0.24),
        ]).pipe(pausableTimeout(3000)),
        OKBlueBtn$,
        OKWhiteBtn$,
        //期间有可能出现多次白OK按钮，以及取消按钮，限定取消按钮的范围
        // 直到超时3秒
        checkEnd$
    ).pipe(
        catchError((err) => {
            // 出现错误，说明无法扫荡
            console.log("无法扫荡", err)
            return throwError("无法扫荡")
        }),
        toArray(),
        tag("扫荡结束")
    )

export const autoSweepsAll$ = goMenuAdventure$.pipe(
    switchMap(() => intoMap$),
    switchMap(() =>
        findImg({
            path: "assets/关卡/地图中的三星.png",
            option: {
                max: 10,
            },
            index: null,
        }).pipe(
            tag("可扫荡的三星图", true),
            switchMap((v) => from(v)),
            max(([x1, y1], [x2, y2]) => (x1 < x2 ? -1 : 1)),
            tap((pt) => click(...pt)),
            pausableTimeout(5000)
        )
    ),
    switchMap(() => sweepsMap(30)),
    toArray(),
    switchMap(() => cancelBtn$),
    catchError((err) => {
        console.log("autoSweepsAll$ err", err)
        return of(false)
    }),
    tag("扫荡地图结束")
)
