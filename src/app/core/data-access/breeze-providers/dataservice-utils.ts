import { HttpResponse, MetadataStore } from 'breeze-client';

export interface IHttpResultsData {
  results: any[];
  inlineCount: number;
  httpResponse: any;
}

export interface IODataRequest {
  method?: string;
}

export const serverTypeNameToClient = (serverTypeName: string): string => {
  // strip off leading 'SP.Data.' and trailing 'ListItem'
  const re = /^(SP\.Data.)(.*)(ListItem)$/;
  const typeName = serverTypeName.replace(re, '$2');

  return MetadataStore.normalizeTypeName(typeName);
};

// crude serializer.  Doesn't recurse
export const toQueryString = (obj: object): string => {
  const parts: string[] = [];
  for (const i in obj) {
    if (obj.hasOwnProperty(i)) {
      parts.push(encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]));
    }
  }
  return parts.join('&');
};
