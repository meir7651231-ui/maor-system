/**
 * 🔨 כל המנועים שהמפרק פירק — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * בעלות על אוספי ה-Db (המודול שמזכיר את טיפוס-הפריט הכי הרבה): {"audit":"platform","courses":"courses","deliveries":"shop7","distributionDays":"shop7","enrollments":"courses","events":"calendar","families":"families","hostBookings":"hosting","hostRecords":"hosting","hostUnits":"hosting","prAds":"parnasa","prListings":"parnasa","prPosts":"parnasa","prRequests":"parnasa","rooms":"diary","shopAssignments":"shop","shopCriteria":"shop","shopEvents":"shop","shopIntakes":"shop","shopItems":"shop","shopProducts":"shop","shopStores":"shop","supporters":"supporters","tasks":"platform","teachers":"courses","tzBoxes":"tzedaka","tzCampaigns":"tzedaka","tzCoordinators":"tzedaka","tzEvents":"tzedaka","volunteers":"shop7","warehouse":"supporters"}
 */
import type { GenEngine } from '../../decompose/types';
import { GEN_CALENDAR } from './calendar';
import { GEN_COURSES } from './courses';
import { GEN_DIARY } from './diary';
import { GEN_FAMILIES } from './families';
import { GEN_HOME } from './home';
import { GEN_HOSTING } from './hosting';
import { GEN_PARNASA } from './parnasa';
import { GEN_PLATFORM } from './platform';
import { GEN_SHOP } from './shop';
import { GEN_SHOP7 } from './shop7';
import { GEN_SHOP8 } from './shop8';
import { GEN_SUPPORTERS } from './supporters';
import { GEN_TELEPHONY } from './telephony';
import { GEN_TIMER } from './timer';
import { GEN_TZEDAKA } from './tzedaka';
import { GEN_WALL } from './wall';
import { GEN_ZMANIM_BOARD } from './zmanimBoard';

export const GENERATED_ENGINES: readonly GenEngine[] = [GEN_CALENDAR, GEN_COURSES, GEN_DIARY, GEN_FAMILIES, GEN_HOME, GEN_HOSTING, GEN_PARNASA, GEN_PLATFORM, GEN_SHOP, GEN_SHOP7, GEN_SHOP8, GEN_SUPPORTERS, GEN_TELEPHONY, GEN_TIMER, GEN_TZEDAKA, GEN_WALL, GEN_ZMANIM_BOARD];
