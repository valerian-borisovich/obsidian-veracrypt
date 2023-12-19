/*             Lang
// import { I18n, type TransItemType } from '~/hlp'
i18n!: I18n
t = (x: TransItemType, vars?: any) => { return this.i18n.t(x, vars) }
*/

import en from "./en.json";
import ru from "./ru.json";

//import zh_cn from "./zh_cn.json";
//import zh_tw from "./zh_tw.json";

export const LANGS = {
  en: en,
  ru: ru,
//  zh_cn: zh_cn,
//  zh_tw: zh_tw,
}


