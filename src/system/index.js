import Core, {
    getHeight,
    getWidth,
    pausable,
    pausableInterval,
    pausableTimeout,
    pausableTimeoutWith, pausableTimer, scale,
    use,
    width
} from "@auto.pro/core"
import ActionPlugin, { click } from "@auto.pro/action"
import SearchPlugin, { clearCache, findImg } from "@auto.pro/search"
import WebViewPlugin, { run } from '@auto.pro/webview'
import {
    BehaviorSubject,
    defer,
    of,
    throwError
} from "rxjs"
import {
    delay,
    finalize,
    map,
    retry,
    switchMap,
    take,
    tap,
    toArray
} from "rxjs/operators"

/**
 * 初始化核心，脚本是基于960x540标准编写的，且需要截图服务
 */
Core({
    baseWidth: 960,
    baseHeight: 540,
    needCap: true,
})

// 启用点击插件、图色插件、网页UI插件
use(ActionPlugin)
use(SearchPlugin)
use(WebViewPlugin)

ui.statusBarColor("#4D493E")

// 请求某个html文件（小水管有点慢）
export const webview = run('http://118.24.169.145:31000/')

// 原封不动导出一些操作符
export { pausableTimer, pausableInterval, pausableTimeout, pausableTimeoutWith }

// 设置一个监听器来实现重做，当需要重做某些操作时直接redoable$.next(值)来触发
export const redoable$ = new BehaviorSubject(true)

// 设置日志信息
let account = 'default', password, taskTag = 3
export function setAccount(a = 'default', p, t) {
    account = a
    password = p
    taskTag = t
    console.log('setAccount', account, password, taskTag)
}

/**
 * 执行网页UI的addLog函数，实现向网页UI输送日志
 * 执行后会得到一个Promise，可通过then获取
 * @param {*} text 
 * @param {*} v 
 */
export const log2Html = (text, v) => {
    webview.runHtmlFunction('addLog', account, [{ level: 'content', text: text + ': ' + v.toString() }]).then(result => console.log("result", result))
}

/**
 * 自定义一个RxJS操作符，实现打印和传输日志
 * @param {*} text 
 * @param {*} showValue 
 */
export const tag = (text, showValue = false) =>
    tap((v) => {
        if (showValue) {
            console.log('tag', text, v)
        } else {
            console.log('tag', text)
        }
        if (v) {
            webview.runHtmlFunction('addLog', account, [{ level: 'content', text: text + ': ' + v.toString() }]).then(result => console.log("result", result))
        }
    })

/**
 * 自定义一个点击图片的Observable，简化找图的参数
 * @param {*} path 
 * @param {*} region 
 * @param {*} threshold 
 */
export const clickImg = (path, region = [0, 0], threshold = 0.9) => {
    return findImg({
        path,
        option: {
            region,
            threshold,
        },
    }).pipe(
        tap((pt) => {
            console.log("click", path, pt)
            click(pt[0] + 10, pt[1] + 5, [600, 800], 10, 5)
        }),
        delay(1000)
    )
}

/**
 * 自定义一个带确认的点击流
 * @param {*} path 
 * @param {*} region 
 * @param {*} threshold 
 * @param {*} checkDelay 
 * @param {*} useCache 默认会在首次找到的范围上进行确认，但确认时目标可能会移动，因此提供这个选项
 */
export const clickImgWithCheck = (
    path,
    region = [0, 0],
    threshold = 0.9,
    checkDelay = 1000,
    useCache = true
) => {

    // 点击和确认都使用同一个找图参数
    const param = {
        path,
        option: {
            region,
            threshold,
        },
        useCache: useCache ? {
            // 使用一个时间戳来进行区域缓存，执行完毕后销毁该缓存
            key: path + Date.now(),
        } : undefined,
    }
    return findImg(param).pipe(
        tap((pt) => {
            console.log("click", path, pt)
            click(...pt, [800, 1000], 2, 2)
        }),
        switchMap((pt) =>
            pausableTimer(checkDelay).pipe(
                switchMap(() => findImg({ ...param, once: true })),
                switchMap((v) => {
                    // 如果点击后能再次找到该图，则再次点击并抛出错误，随后retry会重试确认
                    if (v) {
                        console.log("check unpass", path, v)
                        click(...v, [800, 1000], 2, 2)
                        return throwError("check unpass")
                    } else {
                        console.log("check pass", path)
                        return of(pt)
                    }
                }),
                retry()
            )
        ),
        // 由于是按时间戳生成的唯一缓存，结束后清掉
        finalize(() => useCache && clearCache(param.useCache.key))
    )
}

// 将游戏菜单栏划分成数个区域
const menuWidth = 920 * scale
const beginX = (width - menuWidth) / 2 + 50 * scale

export const goMenuHomePage$ = defer(() => {
    return pausableTimer(2000).pipe(
        pausable(true, true),
        tap(() =>
            log("goMenuHomePage", click(beginX, 520 * scale, [600, 800], 10, 5))
        ),
        delay(1000),
        switchMap(() =>
            findImg({
                path: "assets/我的主页_激活.png",
                option: {
                    region: [
                        0,
                        getHeight(0.9),
                        getWidth(1 / 5),
                        getHeight(0.1),
                    ],
                },
                useCache: {
                    key: "homepage-active",
                },
                once: true,
                // auto的找图会首先进行二值化，颜色差异很可能被忽略掉，valid会补上颜色差异验证
                valid: 10,
            }).pipe(
                switchMap((v) => {
                    console.log("is menuHomePage active", v)
                    if (v) {
                        return of(v)
                    } else {
                        return throwError("err")
                    }
                })
            )
        ),
        retry(),
        take(1),
        delay(2000),
        tag("进入主页", true)
    )
})
export const goMenuRole$ = defer(() => {
    return pausableTimer(2000).pipe(
        pausable(true, true),
        tap(() => click(beginX + 128 * scale, 520 * scale, [600, 800], 10, 5)),
        delay(1000),
        switchMap(() =>
            findImg({
                path: "assets/角色_激活.png",
                option: {
                    region: [
                        0,
                        getHeight(0.9),
                        getWidth(1 / 5),
                        getHeight(0.1),
                    ],
                },
                useCache: {
                    key: "role-active",
                },
                valid: 10,
                once: true,
            }).pipe(
                map((v) => {
                    if (v) {
                        return v
                    } else {
                        throw "err"
                    }
                })
            )
        ),
        retry(),
        toArray(),
        delay(2000),
        tag("进入角色页面")
    )
})
export const goMenuPlot$ = defer(() => {
    return pausableTimer(1000).pipe(
        pausable(true, true),
        tap(() =>
            click(beginX + 128 * 2 * scale + 520 * scale, [600, 800], 10, 5)
        ),
        delay(2000),
        tag("menuPlot")
    )
})
export const goMenuAdventure$ = defer(() => {
    return pausableTimer(2000).pipe(
        pausable(true, true),
        tap(() => {
            console.log(
                "goMenuAdventure",
                click(beginX + 128 * 3 * scale, 520 * scale, [600, 800], 10, 5)
            )
        }),
        delay(1000),
        switchMap(() => findImg({
            path: 'assets/活动/前往活动.png',
            option: {
                region: [getWidth(1 / 3), getHeight(1 / 2), getWidth(1 / 2), getHeight(1 / 2)]
            },
            once: true,
            useCache: {
                key: 'pass-task'
            }
        }).pipe(
            tap(pt => {
                if (pt) {
                    click(...pt)
                }
            })
        )),
        switchMap(() =>
            findImg({
                path: "assets/冒险_主线关卡.png",
                option: {
                    region: [
                        getWidth(1 / 2),
                        0,
                        getWidth(1 / 2),
                        getHeight(2 / 3),
                    ],
                },
                useCache: {
                    key: "adventure-active",
                },
                valid: 10,
                once: true,
            }).pipe(
                map((v) => {
                    if (v) {
                        return v
                    } else {
                        throw "err"
                    }
                })
            )
        ),
        retry(),
        toArray(),
        delay(2000),
        tag("进入冒险页面")
    )
})
export const goMenuHome$ = defer(() => {
    return pausableTimer(2000).pipe(
        pausable(true, true),
        tap(() =>
            click(beginX + 128 * 4 * scale, 520 * scale, [600, 800], 10, 5)
        ),
        delay(2000),
        toArray(),
        tag("进入公会之家")
    )
})
export const goMenuMain$ = defer(() => {
    return pausableTimer(2000).pipe(
        pausable(true, true),
        tap(() =>
            click(beginX + 128 * 6 * scale, 520 * scale, [600, 800], 10, 5)
        ),
        delay(2000),
        toArray(),
        tag("进入主菜单")
    )
})

// 将一些常见按钮封装起来

/**
 * 可取消类型的按钮
 */
export const cancelable$ = findImg({
    path: "assets/可取消按钮.png",
    option: {
        region: [getWidth(1 / 3), getHeight(1 / 2)],
    },
}).pipe(
    tap((pt) => click(...pt, [800, 1000], 5, 5)),
    delay(1000)
)

/**
 * 白色【关闭】按钮
 */
export const closeBtn$ = findImg({
    path: "assets/关闭.png",
    option: {
        region: [getWidth(1 / 3), getHeight(1 / 2)],
    },
}).pipe(
    tap((pt) => click(...pt, [600, 800], 10, 10)),
    delay(1000)
)

/**
 * 计划将区域划分整齐，还未正式使用
 */
export const REGION_LEFT = [
    0, getHeight(1 / 2), getWidth(1 / 2), getHeight(1 / 2)
]
export const REGION_LEFT_TOP = [
    0, getHeight(1 / 2), getWidth(1 / 2), getHeight(0.24)
]
export const REGION_LEFT_BOTTOM = [
    0, getHeight(0.74), getWidth(1 / 2), getHeight(0.26)
]
export const REGION_MIDDLE = [
    getWidth(1 / 3), getHeight(1 / 2), getWidth(1 / 3), getHeight(1 / 2)
]
export const REGION_MIDDLE_TOP = [
    getWidth(1 / 3), getHeight(1 / 2), getWidth(1 / 3), getHeight(0.24)
]
export const REGION_MIDDLE_BOTTOM = [
    getWidth(1 / 3), getHeight(0.74), getWidth(1 / 3), getHeight(0.26)
]
export const REGION_RIGHT = [
    getWidth(1 / 2), getHeight(1 / 2)
]
export const REGION_RIGHT_TOP = [
    getWidth(1 / 2), getHeight(1 / 2), getWidth(1 / 2), getHeight(0.24)
]
export const REGION_RIGHT_BOTTOM = [
    getWidth(1 / 2), getHeight(0.74), getWidth(1 / 2), getHeight(0.26)
]
export const REGION_BODY = [
    getWidth(1 / 3), getHeight(1 / 2), getWidth(2 / 3), getHeight(1 / 2)
]
export const REGION_BODY_BOTTOM = [
    getWidth(1 / 3), getHeight(0.74), getWidth(2 / 3), getHeight(0.26)
]

/**
 * 底部蓝色按钮
 * @param {number} take 查找次数
 * @param {boolean} isPausable 是否可暂停
 */
export const bottomBlue = (take = 1, isPausable = true) =>
    findImg({
        eachTime: 1000,
        path: "assets/可执行按钮.png",
        option: {
            region: REGION_BODY_BOTTOM,
            threshold: 0.9,
        },
        isPausable,
        take,
    }).pipe(
        tap((pt) => {
            console.log(
                "点击底部蓝色按钮",
                click(pt[0] + 20, pt[1] + 5, [800, 1000], 10, 10)
            )
        }),
        delay(1000)
    )

/**
 * 蓝色按钮
 */
export const blueBtn = (take = 1, isPausable = true) =>
    findImg({
        eachTime: 1000,
        path: "assets/可执行按钮.png",
        option: {
            region: REGION_BODY,
            threshold: 0.9,
        },
        isPausable,
        take,
    }).pipe(
        tap((pt) => {
            console.log(
                "点击蓝色按钮",
                click(pt[0] + 20, pt[1] + 5, [800, 1000], 10, 10)
            )
        }),
        delay(1000)
    )

/**
 * 增加扫荡券按钮
 * @param {number} take
 */
export const addBtn = (take = 1) =>
    findImg({
        path: "assets/+.png",
        option: {
            region: [getWidth(3 / 4), getHeight(1 / 2)],
        },
        take,
    }).pipe(tap((pt) => click(...pt, [200, 400], 5, 5)))

/**
 * 左上角【返回】按钮
 */
export const backBtn$ = findImg({
    path: "assets/返回.png",
    option: {
        region: [0, 0, getWidth(1 / 5), getHeight(1 / 5)],
    },
    useCache: {
        key: "back-btn",
    },
}).pipe(
    tap((pt) => click(...pt, [800, 1000], 5, 5)),
    delay(2000),
    tag('返回')
)

export const chooseTeam = (index = 1) =>
    concat(
        clickImg("assets/队伍/我的队伍.png", [
            getWidth(2 / 3),
            0,
            getWidth(1 / 3),
            getHeight(1 / 2),
        ]),
        clickImg("assets/呼出此编组.png", [
            getWidth(2 / 3),
            0,
            getWidth(1 / 3),
            getHeight(1 / 2),
        ])
    )

/**
 * 白色【取消】按钮
 */
export const cancelBtn$ = clickImg("assets/取消.png", [0, getHeight(1 / 2)])

export const hasBack$ = findImg({
    path: "assets/返回.png",
    option: {
        region: [0, 0, getWidth(1 / 5), getHeight(1 / 5)],
    },
    once: true,
    useCache: {
        key: "back-btn",
    },
})

export const OKBlueBtn$ = clickImg("assets/OK.png", [
    getWidth(1 / 3),
    getHeight(1 / 2),
])
export const OKWhiteBtn$ = clickImg("assets/OK_WHITE.png", [
    getWidth(1 / 3),
    getHeight(1 / 2),
])

console.log($shell.checkAccess("root"))


console.log("system end")

export default {}
