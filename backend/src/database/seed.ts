// ============================================================================
// FILE: src/database/seed.ts
// ============================================================================
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AppModule } from '../app.module';
import {
  normalizeAddress,
  renderHtml,
  toPlainText,
} from '../sites/sites.service';
import { Site, SiteDocument } from '../sites/schemas/site.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Visit, VisitDocument } from '../visits/schemas/visit.schema';

/* --------------------------------------------------------------------------
 * Deterministic clock. Every run of the seed produces byte-identical data,
 * so the walk in the recording can be walked again.
 * ------------------------------------------------------------------------ */
const SEED_START = new Date('2024-06-01T17:00:00.000Z');
const minutes = (n: number) => new Date(SEED_START.getTime() + n * 60_000);
const seconds = (n: number) => new Date(SEED_START.getTime() + n * 1_000);

/* --------------------------------------------------------------------------
 * People. The same collection is both "who you can browse as" and "who wrote
 * this". mara, ivo, jun, priya and oskar each wrote at least one page;
 * mara, ivo, jun, priya and oskar each have browsing history too.
 * ------------------------------------------------------------------------ */
const USERS = [
  { name: 'mara', bio: 'Shallow water, four years, one notebook.' },
  { name: 'ivo', bio: 'Walls that stay up and lights that stay on.' },
  { name: 'jun', bio: 'Folds paper. Broadcasts rooms.' },
  { name: 'priya', bio: 'Counts things that will not sit still.' },
  { name: 'oskar', bio: 'Interested in machines that make less noise.' },
  { name: 'wren', bio: 'Reads more than she publishes.' },
  { name: 'tomas', bio: 'Follows links until the links run out.' },
];

/* --------------------------------------------------------------------------
 * Ten sites with real prose, linking to each other, including links to
 * addresses that were never published.
 * ------------------------------------------------------------------------ */
const SITES = [
  {
    address: 'tidepool.zz',
    title: 'The Tidepool Notebook',
    author: 'mara',
    html: `
      <h1>The Tidepool Notebook</h1>
      <p>Every low tide leaves a small room behind, and every room has a different tenant. I have been
      keeping notes on the same six pools for four years now and I have never once found them the same
      twice.</p>
      <p>The first thing you learn is that the water does not leave. It stays in the crevices, under the
      weed, in the hinge of a mussel bed. What leaves is the <em>access</em>, and that is a different
      problem entirely.</p>
      <blockquote>Count the shells you can see. Then wait. Then count them again.</blockquote>
      <p>For the neighbouring shore start with <a href="saltmarsh.zz">Saltmarsh, In Passing</a>. If you
      want the method rather than the place, <a href="brambles.zz">The Bramble Index</a> is closer to it
      than anything I have written. The deep-water survey everyone mentions is supposedly at
      <a href="deepwater.zz">deepwater.zz</a>, which has never once resolved for me.</p>
      <ul>
        <li>Six pools, four years, one notebook.</li>
        <li>Anemones do not move. They are simply elsewhere by morning.</li>
        <li>Bring a torch, even at noon.</li>
      </ul>
    `,
  },
  {
    address: 'saltmarsh.zz',
    title: 'Saltmarsh, In Passing',
    author: 'mara',
    html: `
      <h1>Saltmarsh, In Passing</h1>
      <p>The marsh is not a place you stop at. It is a place you pass through, slowly, on the way to
      somewhere that turns out to be the same marsh.</p>
      <p>What I like about it is the arithmetic. Every channel you can see is the sum of a hundred tides
      that are no longer here, and every one of them was doing exactly what this one is doing now.</p>
      <p>Mara keeps the other half of these notes at <a href="tidepool.zz">The Tidepool Notebook</a>. The
      surveying method behind both is written up at <a href="drystone.zz">Notes on Dry Stone</a>, which
      is about walls and is also, unavoidably, about water.</p>
      <ul>
        <li>Walk it at half tide, either way.</li>
        <li>Do not trust the green.</li>
      </ul>
    `,
  },
  {
    address: 'drystone.zz',
    title: 'Notes on Dry Stone',
    author: 'ivo',
    html: `
      <h1>Notes on Dry Stone</h1>
      <p>A dry stone wall is a wall that has agreed to stay up. There is no mortar anywhere in it and no
      foundation worth the name. It holds because every stone is leaning on two others, and because
      nobody ever took one out to see what would happen.</p>
      <p>The rules are short. Never stack more than two stones high without spanning. Never let a joint
      line up with the joint below it. Face the wall with the flat side out and the heavy side down.</p>
      <blockquote>The wall will tell you where it wants the stone. Your job is to listen faster.</blockquote>
      <p>For the water equivalent see <a href="tidepool.zz">The Tidepool Notebook</a>. My other page is
      <a href="lighthouse.zz">Keeper's Log, Ninth Year</a>. The quarry that supplied most of this stone
      was at <a href="coldharbour.zz">coldharbour.zz</a>, if it is anywhere at all.</p>
    `,
  },
  {
    address: 'lighthouse.zz',
    title: "Keeper's Log, Ninth Year",
    author: 'ivo',
    html: `
      <h1>Keeper's Log, Ninth Year</h1>
      <p>Sixth of March. Wind southwest, four. Visibility poor until noon, then very good. Nothing to
      report, which is the report.</p>
      <p>The log is a form. You fill it in whether or not anything happened, and after a few years the
      empty entries become the interesting ones. A year of <em>nothing to report</em> is a year in which
      the light worked every single night.</p>
      <p>Compare <a href="drystone.zz">Notes on Dry Stone</a> for the same habit in a different material,
      and <a href="slowradio.zz">Slow Radio</a> for the argument that this is what all of it was about.
      The old relief boat timetable is at <a href="ninebell.zz">ninebell.zz</a>.</p>
    `,
  },
  {
    address: 'papercrane.zz',
    title: 'Folding a Paper Crane',
    author: 'jun',
    html: `
      <h1>Folding a Paper Crane</h1>
      <p>You need one square. Not a rectangle you have trimmed by eye, not a rectangle you are fairly
      sure is square. One square.</p>
      <p>The crane is thirty-two folds if you count the ones you undo. Most people give up at the petal
      fold on the eleventh, which is a shame, because the eleventh fold is the only one that is actually
      difficult and everything after it is tidying.</p>
      <ul>
        <li>Crease hard, unfold, then fold again.</li>
        <li>The head and the tail are the same fold, mirrored.</li>
        <li>Wings last.</li>
      </ul>
      <p>Jun also writes at <a href="slowradio.zz">Slow Radio</a>. For something with no instructions at
      all, try <a href="mothlamp.zz">Moths and the Lamps They Choose</a>.</p>
    `,
  },
  {
    address: 'slowradio.zz',
    title: 'Slow Radio: A Manifesto',
    author: 'jun',
    html: `
      <h1>Slow Radio: A Manifesto</h1>
      <p>Radio does not have to be about anything. It can be a room with a window in it, and the window
      is open.</p>
      <p>We broadcast for six hours on a Sunday. Nothing is announced. There are no guests. If a lorry
      goes past the microphone, the lorry is the programme.</p>
      <blockquote>Attention is not a resource to be captured. It is a habit to be practised.</blockquote>
      <p>Related, in ways I have not fully worked out: <a href="lighthouse.zz">Keeper's Log, Ninth
      Year</a> and <a href="quietmachines.zz">Quiet Machines</a>. The schedule, such as it was, was
      posted at <a href="ninebell.zz">ninebell.zz</a> and is no longer anywhere.</p>
    `,
  },
  {
    address: 'mothlamp.zz',
    title: 'Moths and the Lamps They Choose',
    author: 'priya',
    html: `
      <h1>Moths and the Lamps They Choose</h1>
      <p>A moth is not confused by your porch light. It is doing something old, with new equipment, and
      the equipment is winning.</p>
      <p>I have counted moths at eleven lamps in this town for two summers. The lamps differ in wattage,
      height, and how close they are to a hedge. The hedge matters more than the wattage, which nobody
      believes.</p>
      <ul>
        <li>Hedges first. Always hedges first.</li>
        <li>White light above, warm light below, roughly.</li>
        <li>Count at the same time. Count at the same temperature.</li>
      </ul>
      <p>The counting method is written up in <a href="brambles.zz">The Bramble Index</a>. The water side
      of the same argument is <a href="tidepool.zz">The Tidepool Notebook</a>. A lamp that no longer
      exists is recorded at <a href="longpier.zz">longpier.zz</a>.</p>
    `,
  },
  {
    address: 'brambles.zz',
    title: 'The Bramble Index',
    author: 'priya',
    html: `
      <h1>The Bramble Index</h1>
      <p>This is a method for counting something that is impossible to count, which is any patch of
      bramble you have ever tried to walk through.</p>
      <p>You do not count the bramble. You count the places where the bramble stops, and you count them
      along a line you have already measured. The number you get is not the number of brambles. It is a
      number that changes when the bramble changes, and that is all a count has ever needed to do.</p>
      <blockquote>Pick the line before you look at the bramble. Otherwise you will pick the line the
      bramble suggests.</blockquote>
      <p>Applied to moths in <a href="mothlamp.zz">Moths and the Lamps They Choose</a>, and to water in
      <a href="saltmarsh.zz">Saltmarsh, In Passing</a>.</p>
    `,
  },
  {
    address: 'quietmachines.zz',
    title: 'Quiet Machines',
    author: 'oskar',
    html: `
      <h1>Quiet Machines</h1>
      <p>There is a category of machine whose only job is to make less noise than the machine it
      replaced, and those machines are the ones worth writing about.</p>
      <p>A well-set clock is not silent. It is <em>regular</em>, and after a week you stop hearing it,
      which is a different achievement and a better one.</p>
      <ul>
        <li>The fan in the back of the fridge.</li>
        <li>The relay in the boiler, twice an hour.</li>
        <li>Any door with a proper hinge.</li>
      </ul>
      <p>The loudest page on the small web is <a href="ferrytimetable.zz">The Ferry Timetable That Never
      Was</a>. For the opposite of this argument see <a href="slowradio.zz">Slow Radio</a>.</p>
    `,
  },
  {
    address: 'ferrytimetable.zz',
    title: 'The Ferry Timetable That Never Was',
    author: 'oskar',
    html: `
      <h1>The Ferry Timetable That Never Was</h1>
      <p>In 1971 the council printed a timetable for a ferry service that had been cancelled eleven
      months earlier. Two thousand copies were distributed. People used them.</p>
      <p>This is not a story about incompetence. It is a story about how much of a place is held up by
      documents that are technically wrong. The timetable was wrong and the pier was there and the water
      was there, and for a while that was enough.</p>
      <blockquote>A schedule is a promise about the future, made by people who have read the past.</blockquote>
      <p>Oskar also keeps <a href="quietmachines.zz">Quiet Machines</a>. The pier itself is at
      <a href="longpier.zz">longpier.zz</a> and always will be.</p>
    `,
  },
];

/* --------------------------------------------------------------------------
 * An hour of browsing. Every arrival is explicit, so the trails are the same
 * on every machine. priya has been nearly everywhere; mara has the long one;
 * there are repeat visits, broken links, and a history jump.
 * ------------------------------------------------------------------------ */
type Transition = 'typed' | 'link' | 'history';

const TRAILS: Array<{
  user: string;
  startMin: number;
  gapSec: number;
  steps: Array<[string, Transition]>;
}> = [
  {
    // A long trail: fourteen arrivals, two of them repeats, one dead end.
    user: 'mara',
    startMin: 0,
    gapSec: 250,
    steps: [
      ['tidepool.zz', 'typed'],
      ['saltmarsh.zz', 'link'],
      ['tidepool.zz', 'link'],
      ['brambles.zz', 'link'],
      ['deepwater.zz', 'link'],
      ['tidepool.zz', 'history'],
      ['drystone.zz', 'link'],
      ['lighthouse.zz', 'link'],
      ['ninebell.zz', 'link'],
      ['drystone.zz', 'history'],
      ['quietmachines.zz', 'link'],
      ['slowradio.zz', 'link'],
      ['papercrane.zz', 'link'],
      ['tidepool.zz', 'link'],
    ],
  },
  {
    // Nearly everywhere: all ten sites plus one address that never existed.
    user: 'priya',
    startMin: 1,
    gapSec: 285,
    steps: [
      ['tidepool.zz', 'typed'],
      ['saltmarsh.zz', 'link'],
      ['brambles.zz', 'link'],
      ['mothlamp.zz', 'link'],
      ['quietmachines.zz', 'link'],
      ['deepwater.zz', 'link'],
      ['brambles.zz', 'history'],
      ['drystone.zz', 'link'],
      ['lighthouse.zz', 'link'],
      ['ferrytimetable.zz', 'link'],
      ['papercrane.zz', 'link'],
      ['slowradio.zz', 'link'],
    ],
  },
  {
    user: 'ivo',
    startMin: 3,
    gapSec: 380,
    steps: [
      ['drystone.zz', 'typed'],
      ['coldharbour.zz', 'link'],
      ['lighthouse.zz', 'link'],
      ['slowradio.zz', 'link'],
      ['quietmachines.zz', 'link'],
      ['ferrytimetable.zz', 'link'],
      ['lighthouse.zz', 'history'],
      ['drystone.zz', 'link'],
      ['tidepool.zz', 'link'],
    ],
  },
  {
    user: 'jun',
    startMin: 5,
    gapSec: 480,
    steps: [
      ['papercrane.zz', 'typed'],
      ['slowradio.zz', 'link'],
      ['mothlamp.zz', 'link'],
      ['brambles.zz', 'link'],
      ['ninebell.zz', 'link'],
      ['papercrane.zz', 'history'],
      ['quietmachines.zz', 'link'],
    ],
  },
  {
    user: 'oskar',
    startMin: 8,
    gapSec: 600,
    steps: [
      ['quietmachines.zz', 'typed'],
      ['ferrytimetable.zz', 'link'],
      ['longpier.zz', 'link'],
      ['lighthouse.zz', 'link'],
      ['drystone.zz', 'link'],
    ],
  },
];

/* --------------------------------------------------------------------------
 * Run it.
 * ------------------------------------------------------------------------ */
async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const users = app.get<Model<UserDocument>>(getModelToken(User.name));
  const sites = app.get<Model<SiteDocument>>(getModelToken(Site.name));
  const visits = app.get<Model<VisitDocument>>(getModelToken(Visit.name));

  // Idempotent: seeding twice does not double the web.
  console.log('· clearing the existing small web');
  await visits.deleteMany({});
  await sites.deleteMany({});
  await users.deleteMany({});

  console.log(`· ${USERS.length} people`);
  const userDocs = await users.insertMany(USERS);
  const userIdByName = new Map(userDocs.map((u) => [u.name, u._id]));

  console.log(`· ${SITES.length} sites`);
  const siteDocs = await sites.insertMany(
    SITES.map((s) => {
      const html = renderHtml(s.html);
      return {
        address: normalizeAddress(s.address),
        title: s.title,
        html,
        plainText: toPlainText(html),
        authorId: userIdByName.get(s.author)!,
        revision: 1,
      };
    }),
  );
  const siteByAddress = new Map(siteDocs.map((s) => [s.address, s]));

  console.log('· an hour of browsing');
  let visitCount = 0;
  let previousByUser = new Map<string, any>();

  for (const trail of TRAILS) {
    const userId = userIdByName.get(trail.user)!;
    let fromVisitId: any = null;

    for (let i = 0; i < trail.steps.length; i += 1) {
      const [rawAddress, transition] = trail.steps[i];
      const address = normalizeAddress(rawAddress);
      const site = siteByAddress.get(address);

      const visitedAt = seconds(trail.startMin * 60 + i * trail.gapSec);

      const created = await visits.create({
        userId,
        address,
        siteId: site ? site._id : null,
        authorId: site ? site.authorId : null,
        title: site ? site.title : null,
        html: site ? site.html : null,
        transition,
        fromVisitId,
        isError: !site,
        visitedAt,
      });

      fromVisitId = created._id;
      previousByUser.set(trail.user, created._id);
      visitCount += 1;
    }
  }

  // Make sure the text index exists before anybody searches.
  await users.syncIndexes();
  await sites.syncIndexes();
  await visits.syncIndexes();

  console.log(`· ${visitCount} visits`);
  console.log('done. the small web is open.');

  await app.close();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});