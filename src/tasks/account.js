import {
    blueBtn,
    clickImg,
    goMenuMain$,
    pausableInterval,
    pausableTimeoutWith,
    closeBtn$,
    cancelable$,
    tag,
} from "@/system"
import { click } from "@auto.pro/action"
import { getHeight, getWidth } from "@auto.pro/core"
import { findImg } from "@auto.pro/search"
import { concat, generate, merge, of, throwError, using } from "rxjs"
import {
    catchError,
    delay,
    map,
    switchMap,
    tap,
    toArray,
    repeat,
} from "rxjs/operators"

export const accounts = [
    { username: "l3852095", password: "205653", state: "done", taskTag: 3 },
    { username: "bw623267", password: "741137", state: "done", taskTag: 3 },
    { username: "jmln3996", password: "123456q", taskTag: 3 },
    { username: "bc444410", password: "141471", state: "done", taskTag: 3 },
    { username: "ns425539", password: "541400", state: "done", taskTag: 3 },
    { username: "uctr0876", password: "123456q", state: "done", taskTag: 3 },
    { username: "aboa9328", password: "123456q", state: "done", taskTag: 3 },
    {
        username: "ecp02488",
        password: "lgqlee530600",
        state: "done",
        taskTag: 3,
    },
    { username: "sddo0772", password: "123456q", state: "3-1", taskTag: 3 },
    { username: "jmfh5229", password: "123456q" },
    { username: "ozzd6995", password: "123456q" },
    { username: "qhhe9813", password: "123456q" },
    { username: "hqqj0734", password: "123456q" },
    { username: "rbkg0988", password: "123456q" },
    { username: "skbs7641", password: "123456q" },
    { username: "bahj0485", password: "123456q" },
    { username: "peiw1798", password: "123456q" },
    { username: "aprv8651", password: "123456q" },
    { username: "lzfc4085", password: "123456q" },
]

export const account$ = generate(
    0,
    (x) => x < 20,
    (x) => x + 1
).pipe(
    // map((i) => accounts[i])
    map(() => {
        const res = http.get(
            "https://1984825887546962.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/PCR/account/"
        )
        const result = res.body.json()
        const data = result
        console.log("get account", data)
        if (!data) {
            throw "empty account"
        } else {
            return data
        }
    })
)

export const input = (account, password) =>
    clickImg("assets/登录/输入账号.png", [
        getWidth(1 / 4),
        getHeight(1 / 4),
    ]).pipe(
        pausableTimeoutWith(5000, throwError("pausableTimeout")),
        switchMap(() => {
            Text(account)
            return clickImg("assets/登录/输入密码.png", [
                getWidth(1 / 4),
                getHeight(1 / 4),
            ]).pipe(tap(() => Text(password)))
        }),
        catchError((err) => {
            console.log("input err", err)
            if (err === "pausableTimeout") {
                console.log("input pausableTimeout")
                return of(true)
            } else {
                return throwError(err)
            }
        }),
        switchMap(() =>
            clickImg("assets/登录/登录.png", [
                getWidth(1 / 2),
                getHeight(1 / 2),
            ])
        )
    )

export const login = (account, password) => {
    return using(
        () =>
            merge(
                // 如果出现了登录框，则登录
                findImg({
                    path: "assets/登录/登录.png",
                    option: [
                        getWidth(1 / 2),
                        getHeight(1 / 2),
                        getWidth(1 / 3),
                        getHeight(1 / 3),
                    ],
                }).pipe(switchMap(() => input(account, password))),
                // 有签到跳过则跳过
                findImg({
                    path: "assets/签到跳过.png",
                    option: {
                        region: [
                            getWidth(4 / 5),
                            0,
                            getWidth(1 / 5),
                            getHeight(1 / 4),
                        ],
                    },
                }).pipe(
                    tap((pt) => {
                        click(...pt)
                    })
                ),
                closeBtn$.pipe(repeat())
            )
                .pipe(
                    switchMap(() => {
                        return pausableInterval(1500).pipe(
                            tap(() =>
                                click(
                                    getWidth(1 / 2),
                                    getHeight(1 / 2),
                                    [600, 800],
                                    30,
                                    50
                                )
                            )
                        )
                    })
                )
                .subscribe(),
        () =>
            findImg({
                eachTime: 1000,
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
                take: 3,
            }).pipe(toArray())
    ).pipe(tag("登录完成"))
}

export const changeAccount$ = concat(
    goMenuMain$,
    clickImg("assets/主菜单/回到标题页面.png"),
    blueBtn(1)
).pipe(toArray())
