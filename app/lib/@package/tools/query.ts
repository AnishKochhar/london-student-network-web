/*
  query.ts
  Strongly-typed CSS-selector-based scraping utility with overloads + implementation
*/
import { CountArrayDepth, Last, Parsed, Shear, Typeof } from './types'
import { selectOne, selectAll } from 'css-select'
import * as du from 'domutils'
import * as is from 'typeofit'

export interface Query<T> extends Shear<Parsed, T> {}

// ── Overload signatures ─────────────────────────────────────────────────────
export function query<
  T extends ReadonlyArray<string | [string]> 
>(
  ...args: T
): Query<CountArrayDepth<T, string | undefined>>

export function query<
  T extends [...ReadonlyArray<string | [string]>, Shear<Parsed, any>]
>(
  ...args: T
): Query<CountArrayDepth<T, Typeof<Last<T>> | undefined>>

export function query<
  T extends [
    ...ReadonlyArray<string | [string] | Shear<Parsed, Parsed>>, 
    Record<string, string | [string] | Shear<Parsed, any>>
  ]
>(
  ...args: T
): Query<
  CountArrayDepth<
    T,
    {
      [K in keyof Last<T>]: Last<T>[K] extends [string]
        ? string[]
        : Last<T>[K] extends Shear<any, infer I>
          ? Awaited<I>
          : string | undefined
    }
  >
>

// ── Implementation ───────────────────────────────────────────────────────────
export function query(...args: any[]): any {
  return async (ctx: any) => {
    const [selector, ...rest] = args
    const isLast = rest.length === 0

    // string selector
    if (is.string(selector)) {
      const [qry, attr] = selector.split('@')
      const data = qry ? selectOne(qry, ctx.data) : ctx.data
      if (!isLast) return query(...rest)({ ...ctx, data })
      if (attr) return data?.attribs?.[attr]
      return data ? du.textContent(data) : undefined
    }

    // function as selector
    if (is.func(selector)) {
      return selector(ctx).then((result: any) => {
        return isLast ? result : query(...rest)(result)
      })
    }

    // array selector
    if (is.array()(selector)) {
      if (!ctx.data) return []
      const [qry, attr] = selector[0].split('@')
      const nodes = selectAll(qry, ctx.data)
      if (!isLast) {
        return Promise.all(nodes.map((node) => query(...rest)({ ...ctx, data: node })))
      }
      return nodes.map((node) => attr ? node?.attribs?.[attr] : du.textContent(node))
    }

    // object of selectors
    const entries = await Promise.all(
      Object.entries(selector).map(async ([key, sel]) => {
        const value = await query(sel as any)(ctx)
        return [key, value]
      })
    )

    return Object.fromEntries(entries)
  }
}
