import { empty, isObservable, of, Subject } from "rxjs"
import { concatMap } from "rxjs/operators"

export const queue$ = new Subject()

export const queueOB$ = queue$
    .pipe(
        concatMap((e) => {
            if (typeof e === "function") {
                const result = e()
                if (isObservable(result)) {
                    return result
                } else {
                    return empty()
                }
            } else {
                if (isObservable(e)) {
                    return e
                } else {
                    return of(e)
                }
            }
        })
    )