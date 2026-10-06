// ============================================================
// ХРОНІКИ ЗГАСЛОГО СВІТАНКУ
// Базова бойова система
// ============================================================

export const ELEMENTS = {
  FIRE: "Жар",
  ROOT: "Корінь",
  TIDE: "Приплив",
  LIGHT: "Світло",
  SHADOW: "Тінь",
};

export const ELEMENT_ADVANTAGE = {
  [ELEMENTS.FIRE]: ELEMENTS.ROOT,
  [ELEMENTS.ROOT]: ELEMENTS.TIDE,
  [ELEMENTS.TIDE]: ELEMENTS.FIRE,
};

export const SKILL_TYPES = {
  BASIC: "basic",
  SPECIAL: "special",
  ULTIMATE: "ultimate",
};

// ------------------------------------------------------------
// Допоміжні функції
// ------------------------------------------------------------

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function isAlive(unit) {
  return unit && unit.hp > 0;
}

export function getAliveUnits(units = []) {
  return units.filter(isAlive);
}

export function getRandomAliveUnit(units = []) {
  const alive = getAliveUnits(units);

  if (!alive.length) {
    return null;
  }

  return alive[Math.floor(Math.random() * alive.length)];
}

// ------------------------------------------------------------
// Система стихій
// ------------------------------------------------------------

export function getElementMultiplier(attackerElement, defenderElement) {
  if (!attackerElement || !defenderElement) {
    return 1;
  }

  // Жар → Корінь → Приплив → Жар
  if (
    ELEMENT_ADVANTAGE[attackerElement] === defenderElement
  ) {
    return 1.25;
  }

  if (
    ELEMENT_ADVANTAGE[defenderElement] === attackerElement
  ) {
    return 0.8;
  }

  // Світло ↔ Тінь
  if (
    attackerElement === ELEMENTS.LIGHT &&
    defenderElement === ELEMENTS.SHADOW
  ) {
    return 1.25;
  }

  if (
    attackerElement === ELEMENTS.SHADOW &&
    defenderElement === ELEMENTS.LIGHT
  ) {
    return 1.25;
  }

  return 1;
}

// ------------------------------------------------------------
// Критичний удар
// ------------------------------------------------------------

export function rollCritical(crit = 0) {
  const chance = clamp(Number(crit) || 0, 0, 100);

  return Math.random() * 100 < chance;
}

// ------------------------------------------------------------
// Розрахунок шкоди
// ------------------------------------------------------------

export function calculateDamage(attacker, defender, skill = {}) {
  const attack = Number(attacker?.attack) || 0;
  const defense = Number(defender?.defense) || 0;

  const multiplier =
    Number(skill.multiplier) || 1;

  const elementMultiplier = getElementMultiplier(
    attacker?.element,
    defender?.element
  );

  const baseDamage = Math.max(
    1,
    attack * multiplier - defense * 0.5
  );

  const critical = rollCritical(attacker?.crit || 0);

  const criticalMultiplier = critical ? 1.5 : 1;

  const damage = Math.max(
    1,
    Math.round(
      baseDamage *
        elementMultiplier *
        criticalMultiplier
    )
  );

  return {
    damage,
    critical,
    elementMultiplier,
    baseDamage: Math.round(baseDamage),
  };
}

// ------------------------------------------------------------
// Навички
// ------------------------------------------------------------

export const DEFAULT_SKILLS = {
  basic: {
    id: "basic_attack",
    name: "Удар",
    type: SKILL_TYPES.BASIC,
    multiplier: 1,
    ultimateCharge: 20,
  },

  special: {
    id: "special_attack",
    name: "Особлива навичка",
    type: SKILL_TYPES.SPECIAL,
    multiplier: 1.5,
    ultimateCharge: 20,
  },

  ultimate: {
    id: "ultimate_attack",
    name: "Абсолютна сила",
    type: SKILL_TYPES.ULTIMATE,
    multiplier: 2.5,
    ultimateCharge: 0,
  },
};

export function getAbility(type = SKILL_TYPES.BASIC) {
  return (
    DEFAULT_SKILLS[type] ||
    DEFAULT_SKILLS.basic
  );
}

// ------------------------------------------------------------
// Ініціатива
// ------------------------------------------------------------

export function calculateInitiative(units = []) {
  return [...units]
    .filter(isAlive)
    .sort((a, b) => {
      const speedA = Number(a.speed) || 0;
      const speedB = Number(b.speed) || 0;

      if (speedB !== speedA) {
        return speedB - speedA;
      }

      return Math.random() - 0.5;
    });
}

// ------------------------------------------------------------
// Створення стану юніта в бою
// ------------------------------------------------------------

export function createBattleUnit(unit, team = "player") {
  const maxHp =
    Number(unit.maxHp) ||
    Number(unit.hp) ||
    100;

  return {
    ...unit,

    team,

    hp: maxHp,
    maxHp,

    energy: Number(unit.energy) || 0,
    ultimate: Number(unit.ultimate) || 0,

    statusEffects: [],

    shield: Number(unit.shield) || 0,

    stunned: false,
    poisoned: false,
    bleeding: false,
  };
}

// ------------------------------------------------------------
// Створення бою
// ------------------------------------------------------------

export function createBattleState(
  playerTeam = [],
  enemyTeam = []
) {
  const players = playerTeam.map((unit) =>
    createBattleUnit(unit, "player")
  );

  const enemies = enemyTeam.map((unit) =>
    createBattleUnit(unit, "enemy")
  );

  const allUnits = calculateInitiative([
    ...players,
    ...enemies,
  ]);

  return {
    players,
    enemies,

    turn: 1,

    activeUnitId:
      allUnits[0]?.id || null,

    turnOrder: allUnits.map(
      (unit) => unit.id
    ),

    winner: null,

    finished: false,

    log: [],
  };
}

// ------------------------------------------------------------
// Пошук юніта
// ------------------------------------------------------------

export function findUnit(state, unitId) {
  if (!state || !unitId) {
    return null;
  }

  return (
    state.players.find(
      (unit) => unit.id === unitId
    ) ||
    state.enemies.find(
      (unit) => unit.id === unitId
    ) ||
    null
  );
}

// ------------------------------------------------------------
// Застосування шкоди
// ------------------------------------------------------------

export function applyDamage(unit, damage) {
  if (!unit || damage <= 0) {
    return {
      unit,
      actualDamage: 0,
      blocked: 0,
    };
  }

  let remainingDamage = damage;
  let blocked = 0;

  // Спочатку знімаємо щит
  if (unit.shield > 0) {
    blocked = Math.min(
      unit.shield,
      remainingDamage
    );

    remainingDamage -= blocked;

    unit = {
      ...unit,
      shield: unit.shield - blocked,
    };
  }

  const actualDamage = Math.min(
    unit.hp,
    remainingDamage
  );

  return {
    unit: {
      ...unit,
      hp: Math.max(
        0,
        unit.hp - actualDamage
      ),
    },

    actualDamage,
    blocked,
  };
}

// ------------------------------------------------------------
// Заряд ультимейту
// ------------------------------------------------------------

export function chargeUltimate(unit, amount = 20) {
  if (!unit) {
    return unit;
  }

  return {
    ...unit,

    ultimate: clamp(
      (Number(unit.ultimate) || 0) +
        amount,
      0,
      100
    ),
  };
}

// ------------------------------------------------------------
// Виконання атаки
// ------------------------------------------------------------

export function performAttack(
  state,
  attackerId,
  defenderId,
  skillType = SKILL_TYPES.BASIC
) {
  const attacker = findUnit(
    state,
    attackerId
  );

  const defender = findUnit(
    state,
    defenderId
  );

  if (!attacker || !defender) {
    return {
      state,
      result: null,
    };
  }

  if (!isAlive(attacker) || !isAlive(defender)) {
    return {
      state,
      result: null,
    };
  }

  const skill = getAbility(skillType);

  // Ультимейт доступний лише при 100%
  if (
    skill.type === SKILL_TYPES.ULTIMATE &&
    attacker.ultimate < 100
  ) {
    return {
      state,
      result: {
        success: false,
        reason: "ultimate_not_ready",
      },
    };
  }

  const damageResult =
    calculateDamage(
      attacker,
      defender,
      skill
    );

  const applied =
    applyDamage(
      defender,
      damageResult.damage
    );

  const ultimateCharge =
    skill.type === SKILL_TYPES.ULTIMATE
      ? 0
      : skill.ultimateCharge;

  const updatedAttacker =
    chargeUltimate(
      attacker,
      ultimateCharge
    );

  let players = state.players.map(
    (unit) => {
      if (unit.id === attacker.id) {
        return updatedAttacker;
      }

      if (unit.id === defender.id) {
        return applied.unit;
      }

      return unit;
    }
  );

  let enemies = state.enemies.map(
    (unit) => {
      if (unit.id === attacker.id) {
        return updatedAttacker;
      }

      if (unit.id === defender.id) {
        return applied.unit;
      }

      return unit;
    }
  );

  const nextState = {
    ...state,
    players,
    enemies,
  };

  const playersAlive =
    getAliveUnits(players).length > 0;

  const enemiesAlive =
    getAliveUnits(enemies).length > 0;

  let winner = null;

  if (!enemiesAlive) {
    winner = "player";
  } else if (!playersAlive) {
    winner = "enemy";
  }

  const logEntry = {
    id: `${Date.now()}-${Math.random()}`,
    attackerId: attacker.id,
    defenderId: defender.id,
    skill: skill.name,
    damage: applied.actualDamage,
    blocked: applied.blocked,
    critical: damageResult.critical,
    elementMultiplier:
      damageResult.elementMultiplier,
    turn: state.turn,
  };

  nextState.log = [
    ...(state.log || []),
    logEntry,
  ];

  if (winner) {
    nextState.finished = true;
    nextState.winner = winner;
  }

  return {
    state: nextState,
    result: {
      success: true,
      attacker,
      defender,
      skill,
      damage: applied.actualDamage,
      blocked: applied.blocked,
      critical: damageResult.critical,
      elementMultiplier:
        damageResult.elementMultiplier,
      winner,
    },
  };
}

// ------------------------------------------------------------
// Наступний хід
// ------------------------------------------------------------

export function getNextTurn(state) {
  if (!state || state.finished) {
    return state;
  }

  const aliveUnits = [
    ...getAliveUnits(state.players),
    ...getAliveUnits(state.enemies),
  ];

  if (!aliveUnits.length) {
    return {
      ...state,
      finished: true,
    };
  }

  const currentIndex =
    state.turnOrder.indexOf(
      state.activeUnitId
    );

  for (
    let offset = 1;
    offset <= state.turnOrder.length;
    offset++
  ) {
    const index =
      (currentIndex + offset) %
      state.turnOrder.length;

    const nextId =
      state.turnOrder[index];

    const nextUnit =
      aliveUnits.find(
        (unit) => unit.id === nextId
      );

    if (nextUnit) {
      const turnIncreased =
        index <= currentIndex;

      return {
        ...state,

        activeUnitId: nextId,

        turn: turnIncreased
          ? state.turn + 1
          : state.turn,
      };
    }
  }

  return state;
}

// ------------------------------------------------------------
// Перевірка переможця
// ------------------------------------------------------------

export function getWinner(state) {
  if (!state) {
    return null;
  }

  const playersAlive =
    getAliveUnits(state.players).length;

  const enemiesAlive =
    getAliveUnits(state.enemies).length;

  if (playersAlive === 0) {
    return "enemy";
  }

  if (enemiesAlive === 0) {
    return "player";
  }

  return null;
}

// ------------------------------------------------------------
// Статуси
// ------------------------------------------------------------

export function applyPoison(unit, damage = 5) {
  if (!unit || !isAlive(unit)) {
    return unit;
  }

  return {
    ...unit,

    poisoned: true,

    statusEffects: [
      ...(unit.statusEffects || []).filter(
        (effect) => effect.type !== "poison"
      ),

      {
        type: "poison",
        damage,
        turns: 3,
      },
    ],
  };
}

export function applyBleed(unit, damage = 5) {
  if (!unit || !isAlive(unit)) {
    return unit;
  }

  return {
    ...unit,

    bleeding: true,

    statusEffects: [
      ...(unit.statusEffects || []).filter(
        (effect) => effect.type !== "bleed"
      ),

      {
        type: "bleed",
        damage,
        turns: 3,
      },
    ],
  };
}

export function applyStun(unit, turns = 1) {
  if (!unit || !isAlive(unit)) {
    return unit;
  }

  return {
    ...unit,

    stunned: true,

    statusEffects: [
      ...(unit.statusEffects || []).filter(
        (effect) => effect.type !== "stun"
      ),

      {
        type: "stun",
        turns,
      },
    ],
  };
}

export function addShield(unit, amount) {
  if (!unit) {
    return unit;
  }

  return {
    ...unit,

    shield:
      (Number(unit.shield) || 0) +
      Math.max(0, Number(amount) || 0),
  };
}

// ------------------------------------------------------------
// Обробка ефектів на початку ходу
// ------------------------------------------------------------

export function processStatusEffects(unit) {
  if (!unit || !isAlive(unit)) {
    return {
      unit,
      damage: 0,
      effects: [],
    };
  }

  let updatedUnit = {
    ...unit,
  };

  let totalDamage = 0;
  const remainingEffects = [];

  for (
    const effect of unit.statusEffects || []
  ) {
    if (effect.type === "poison") {
      totalDamage +=
        Number(effect.damage) || 0;
    }

    if (effect.type === "bleed") {
      totalDamage +=
        Number(effect.damage) || 0;
    }

    const turns =
      (Number(effect.turns) || 0) - 1;

    if (turns > 0) {
      remainingEffects.push({
        ...effect,
        turns,
      });
    }
  }

  updatedUnit.hp = Math.max(
    0,
    updatedUnit.hp - totalDamage
  );

  updatedUnit.statusEffects =
    remainingEffects;

  updatedUnit.poisoned =
    remainingEffects.some(
      (effect) =>
        effect.type === "poison"
    );

  updatedUnit.bleeding =
    remainingEffects.some(
      (effect) =>
        effect.type === "bleed"
    );

  const stunEffect =
    remainingEffects.find(
      (effect) =>
        effect.type === "stun"
    );

  updatedUnit.stunned =
    Boolean(stunEffect);

  return {
    unit: updatedUnit,
    damage: totalDamage,
    effects: remainingEffects,
  };
}

// ------------------------------------------------------------
// Нагороди за перемогу
// ------------------------------------------------------------

export function calculateBattleRewards({
  enemyPower = 100,
  stage = 1,
  difficultyMultiplier = 1,
} = {}) {
  const power =
    Math.max(1, Number(enemyPower) || 100);

  const level =
    Math.max(1, Number(stage) || 1);

  const multiplier =
    Math.max(
      0.1,
      Number(difficultyMultiplier) || 1
    );

  return {
    gold: Math.round(
      (50 + power * 0.35 + level * 10) *
        multiplier
    ),

    xp: Math.round(
      (40 + power * 0.25 + level * 8) *
        multiplier
    ),

    energy: 0,
  };
}

// ------------------------------------------------------------
// Результат бою
// ------------------------------------------------------------

export function createBattleResult(
  state,
  options = {}
) {
  const winner =
    getWinner(state);

  const rewards =
    winner === "player"
      ? calculateBattleRewards(options)
      : {
          gold: 0,
          xp: 0,
          energy: 0,
        };

  return {
    winner,
    victory: winner === "player",
    defeat: winner === "enemy",

    rewards,

    turns: state?.turn || 0,

    log: state?.log || [],
  };
    }
