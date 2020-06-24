import { cancelable$, clickImg, goMenuHome$ } from "@/system"
import { getHeight, getWidth, pausableTimeout } from "@auto.pro/core"
import { concat, of, defer } from "rxjs"
import { catchError, toArray, finalize } from "rxjs/operators"
import { pauseSpecia, resumeSpecia } from "@/specia"

export const home$ = defer(() => {
    pauseSpecia()
    return concat(
        goMenuHome$,
        clickImg("assets/公会之家/全部收取.png", [
            getWidth(3 / 4),
            getHeight(2 / 3),
        ]).pipe(pausableTimeout(5000)),
        cancelable$.pipe(pausableTimeout(3000))
    ).pipe(
        catchError((err) => of(true)),
        toArray(),
        finalize(() => resumeSpecia())
    )

})