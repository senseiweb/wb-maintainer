// tslint:disable: interface-name
export type Instantiable<T> = new (...args: any[]) => T;

export interface IInstatiable {
  new (...args: any[]);
}

// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
export type Unarray<T> = T extends Array<infer U> ? U : T;

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
