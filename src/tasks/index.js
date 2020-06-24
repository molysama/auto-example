import { resumeSpecia } from "@/specia"
import { setAccount } from "@/system"
import { click, clickRes } from "@auto.pro/action"
import { getHeight, getWidth, resume } from "@auto.pro/core"
import { findImg } from "@auto.pro/search"
import { concat, generate, interval, of, using } from "rxjs"
import {
    concatAll, concatMap,
    delay,
    map, switchMap,
    tap,
    toArray
} from "rxjs/operators"
import { changeAccount$, login } from "./account"
import { discover$ } from "./discover"
import { dnf$ } from "./dnf"
import {
    autoFinishRank$, autoIntens$,
    autoRank$, grow$,
    resetAddStrengthTimes
} from "./grow"
import { home$ } from "./home"
import { autoSweepsAll$, singleMap$ } from "./map"
import { recievePresent$, recieveTask$ } from "./recieve"
import { send$ } from "./send"
import { dailyShop$ } from "./shop"

const TAGINFO = {
    1: [
        home$,
        recieveTask$,
        recievePresent$,
        grow$,
        autoSweepsAll$,
        autoFinishRank$,
        autoRank$,
        autoIntens$,
        recieveTask$,
        recievePresent$,
    ],
    2: [recieveTask$, home$, send$, discover$, recieveTask$, recievePresent$],
    3: [
        recieveTask$,
        home$,
        discover$,
        send$,
        dnf$,
        grow$,
        autoSweepsAll$,
        autoFinishRank$,
        autoRank$,
        autoIntens$,
        dailyShop$,
        recieveTask$,
        recievePresent$,
    ],
    4: [
        recieveTask$,
        home$,
        singleMap$,
        discover$,
        recieveTask$,
        recievePresent$,
    ],
    5: [send$],
    6: [grow$],
}

export const task$ = generate(
    0,
    (x) => x < 20,
    (x) => x + 1
).pipe(
    concatMap((x) => {
        resetAddStrengthTimes()
        resumeSpecia()
        resume()

        sleep(1000)

        return findImg({
            path: "assets/立绘.png",
            option: {
                region: [
                    getWidth(9 / 10),
                    0,
                    getWidth(1 / 10),
                    getHeight(1 / 5),
                ],
            },
            useCache: {
                key: "lihui",
            },
            once: true,
        }).pipe(
            switchMap((pt) => {
                console.log("立绘", pt)
                if (!pt) {
                    // 请求账号信息，我打码处理了
                    const res = http.get(
                        `http://xxxxxxx.com/xxxxx`
                    )
                    const result = res.body.json()
                    const data = result
                    console.log("get account", data)
                    if (!data || !result || res.statusCode != 200) {
                        throw "empty account"
                    }

                    const { username: account, password = 'password', taskTag = 3 } = data
                    console.log(x, account, password, taskTag)
                    setAccount(account, password, taskTag)

                    return findImg({
                        path: "assets/登录主菜单.png",
                        option: {
                            region: [
                                0,
                                getHeight(4 / 5),
                                getWidth(1 / 5),
                                getHeight(1 / 5),
                            ],
                        },
                    }).pipe(
                        delay(1000),
                        switchMap(() => {
                            return using(
                                () => interval(200).pipe(
                                    tap(() => clickRes(940, 15, [100, 200], 5, 5))
                                ).subscribe(),
                                () => findImg({
                                    path: 'assets/登录/登录.png',
                                    region: [
                                        getWidth(1 / 2),
                                        getHeight(1 / 2),
                                        getWidth(1 / 4),
                                        getHeight(1 / 4),
                                    ],
                                })
                            )
                        }),
                        delay(1000),
                        switchMap(() => login(account, password)),
                        toArray(),
                        map(() => taskTag)
                    )
                } else {
                    // 点击权限在首次执行时才会去申请权限，因此这里点击一下屏幕中央来申请权限
                    click(getWidth(1 / 2), getHeight(1 / 2), [200, 300], 50, 50)
                    sleep(5000)
                    return of(3)
                }
            }),
            switchMap((taskTag) => concat(...TAGINFO[taskTag])),
            toArray(),
            switchMap(() => changeAccount$)
        )
    }),
    concatAll()
)
