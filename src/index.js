import "@/system"
import { goMenuHomePage$, log2Html, webview } from "@/system"
import { resume } from "@auto.pro/core"
import { concat, fromEvent, race, throwError, timer } from "rxjs"
import {
    catchError, exhaustMap,
    retry, share, switchMap,
    tap
} from "rxjs/operators"
import { specia$ } from "./specia"
import { task$ } from "./tasks"


let mainThread
let taskSub

/**
 * 监听html发送的的start事件，然后执行本地start函数
 */
webview.on("start", start)

/**
 * 监听html发送的stop事件
 */
webview.on('stop', () => {

    // 停止订阅
    taskSub && taskSub.unsubscribe()
    mainThread && mainThread.interrupt()

    taskSub = null
    mainThread = null
    toastLog('stop')
})


function start() {
    console.log("start")

    // 由于当前算是ui线程，要做阻塞操作需要开启新线程
    mainThread = threads.start(() => {
        app.launch("com.bilibili.priconne")
        sleep(1000)

        taskSub = task$.pipe(
            // 监听到错误的话，打印异常并返回主页面，接着抛出一个错误
            catchError(err => {
                console.log('发生错误', err)
                log2Html('捕获到异常', err)
                return concat(goMenuHomePage$, throwError(err))
            }),
            // 收到错误就重试整个task$
            retry()
        ).subscribe()

        // specia$对一些特殊状态进行监听，出现这些特殊状态时暂停主流程
        specia$
            .pipe(
                // 每次输出都重置成一个10秒延迟的流，该流成功执行时取消暂停
                switchMap((v) => {
                    return timer(10000).pipe(
                        tap(() => {
                            console.log("resume")
                            resume()
                        })
                    )
                })
            )
            .subscribe()
    })
}

// 监听系统【返回键】事件，使用share共享事件
const back$ = fromEvent(ui.emitter, "back_pressed").pipe(share())

// 两秒内连续触发两次事件才会真正返回
back$
    .pipe(
        exhaustMap((e) => {
            toast("再次返回可退出")
            e.consumed = true
            return race(
                back$.pipe(tap(() => (e.consumed = false))),
                timer(2000)
            )
        })
    )
    .subscribe({
        next(e) {
            log("back", e)
        },
        error(err) {
            log("back error", err)
        },
    })
