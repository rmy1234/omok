export class Position {
  constructor(
    public readonly row: number,
    public readonly col: number
  ) {
    if (row < 0 || row >= 15 || col < 0 || col >= 15) {
      throw new Error('Position is out of bounds');
    }
  }

  equals(other: Position): boolean {
    return this.row === other.row && this.col === other.col;
  }

  toString(): string {
    return `(${this.row}, ${this.col})`;
  }
}




