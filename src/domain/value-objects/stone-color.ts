export enum StoneColor {
  BLACK = 'BLACK',
  WHITE = 'WHITE',
  EMPTY = 'EMPTY',
}

export class StoneColorValue {
  static getOpponent(color: StoneColor): StoneColor {
    if (color === StoneColor.BLACK) return StoneColor.WHITE;
    if (color === StoneColor.WHITE) return StoneColor.BLACK;
    return StoneColor.EMPTY;
  }

  static isPlayer(color: StoneColor): boolean {
    return color === StoneColor.BLACK || color === StoneColor.WHITE;
  }
}




