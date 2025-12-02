import { Position } from '../value-objects/position';
import { StoneColor } from '../value-objects/stone-color';

export class Stone {
  constructor(
    public readonly position: Position,
    public readonly color: StoneColor
  ) {
    if (color === StoneColor.EMPTY) {
      throw new Error('Stone cannot be empty');
    }
  }

  equals(other: Stone): boolean {
    return (
      this.position.equals(other.position) && this.color === other.color
    );
  }
}




