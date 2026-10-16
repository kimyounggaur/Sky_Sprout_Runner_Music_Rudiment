export function getArcadeBody(
  gameObject: Phaser.GameObjects.GameObject
): Phaser.Physics.Arcade.Body {
  const body = gameObject.body;

  if (!(body instanceof Phaser.Physics.Arcade.Body)) {
    throw new Error(`Expected ${gameObject.name || gameObject.type} to have an Arcade body.`);
  }

  return body;
}

export function getStaticBody(
  gameObject: Phaser.GameObjects.GameObject
): Phaser.Physics.Arcade.StaticBody {
  const body = gameObject.body;

  if (!(body instanceof Phaser.Physics.Arcade.StaticBody)) {
    throw new Error(`Expected ${gameObject.name || gameObject.type} to have a static Arcade body.`);
  }

  return body;
}

export function isArcadeSprite(value: unknown): value is Phaser.Physics.Arcade.Sprite {
  return value instanceof Phaser.Physics.Arcade.Sprite;
}
