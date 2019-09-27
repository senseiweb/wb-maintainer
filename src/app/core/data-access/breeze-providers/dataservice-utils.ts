// import {
//   HttpResponse,
//   MetadataStore,
//   DataProperty,
//   DataType
// } from 'breeze-client';

// export interface IHttpResultsData {
//   results: any[];
//   inlineCount: number;
//   httpResponse: any;
// }

// export const transformValue = (prop: DataProperty, val: any) => {
//   if (prop.isUnmapped) {
//     return undefined;
//   }

//   if (prop.dataType === DataType.DateTimeOffset) {
//     // The datajs lib tries to treat client dateTimes that are defined as DateTimeOffset on the server differently
//     // from other dateTimes. This fix compensates before the save.
//     val = val && new Date(val.getTime() - val.getTimezoneOffset() * 60000);
//   } else if ((prop.dataType as DataType).quoteJsonOData) {
//     val = val != null ? val.toString() : val;
//   }
//   return val;
// }

// export const serverTypeNameToClient = (serverTypeName: string): string => {
//   // strip off leading 'SP.Data.' and trailing 'ListItem'
//   const re = /^(SP\.Data.)(.*)(ListItem)$/;
//   const typeName = serverTypeName.replace(re, '$2');

//   return MetadataStore.normalizeTypeName(typeName);
// };

// // crude serializer.  Doesn't recurse
// export const toQueryString = (obj: object): string => {
//   const parts: string[] = [];
//   for (const i in obj) {
//     if (obj.hasOwnProperty(i)) {
//       parts.push(encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]));
//     }
//   }
//   return parts.join('&');
// };
