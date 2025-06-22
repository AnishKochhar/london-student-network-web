import { URLSearchParams } from 'url'
import * as s from '../../../../tools'
import dayjs from 'dayjs'

import { parseStartEnd } from '../../utility'
import { crawler } from '../../context'

export const run = crawler(async () => {
  // ——— build query params with URLSearchParams ———
  const params = new URLSearchParams({
    entryRequirements: 'false',
    timePeriod: `${dayjs().toISOString()}--${dayjs().add(1, 'year').toISOString()}`,
    typeOfEvent: '0/1/277/281/282',
  })
  const events_link = `https://www.lse.ac.uk/events/search-events?${params.toString()}`

  // ——— list page scrape ———
  const cards = await s.goto(
    events_link,
    s.query(['article'], {
      link: 'a@href',
      time: '.card__content__date',
      image: 'img@src',
    }),
  )()

  // ——— detail-page scrape per card ———
  const collect = await Promise.all(
    cards.map((x) =>
      s.goto(
        x.link || '',
        s.query({
          link: () => Promise.resolve(x.link),
          image: () => Promise.resolve({ src: `https://www.lse.ac.uk${x.image}` }),
          title: 'h1',
          time: '.eventHeader__date',
          summary: '.eventArticle',
          location: '.eventPage__locationTitle',
        }),
      )(),
    ),
  )

  // ——— normalize into your Lecture shape ———
  const lectures = collect.map((x) => ({
    free: true,
    link: x.link,
    title: x.title?.trim(),
    summary: x.summary?.trim(),
    location: x.location?.trim(),
    ...parseStartEnd(x.time?.trim() || ''),
  }))

  return {
    name: 'London School of Economics',
    website: 'http://www.lse.ac.uk/',
    twitter: '@LSEnews',
    lectures,
  }
})
