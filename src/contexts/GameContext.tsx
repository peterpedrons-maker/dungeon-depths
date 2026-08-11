import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  GameState,
  GameScreen,
  Character,
  CharacterClass,
  DungeonRoom,
  EncounterType,
  CombatState,
  Enemy,
  Item,
  CLASS_BASE_STATS,
  PathDirection,
  DiscoveredRoom,
  MAX_LEVEL,
} from '@/types/game';
import { CLASS_BASE_ATTRIBUTES, CLASS_ATTRIBUTE_GROWTH } from '@/types/classes';
import { calculateDerivedStats, PrimaryAttributes, ATTRIBUTE_POINTS_PER_LEVEL } from '@/types/attributes';
import { LootItem, EquippedItems, EquipmentSlot } from '@/types/items';
import { LearnedSkill, ActiveBuff, SKILL_POINTS_PER_LEVEL, STARTING_SKILL_POINTS, calculateSkillEffectValue, getPassiveBonuses } from '@/types/skills';
import { getClassSkills, getSkillById, canLearnSkill } from '@/lib/skillData';
import { generateRoom, generateEnemy, ITEMS } from '@/lib/gameData';
import { generateLootItem } from '@/lib/lootGenerator';
import { getMonasteryStartRoom, getNextMonasteryRoom, isMonasteryBossRoom } from '@/lib/monasteryDungeon';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'dungeon-crawler-save';
const CHARACTER_ID_KEY = 'dungeon-crawler-character-id';

const EMPTY_EQUIPPED: EquippedItems = {
  helm: null,
  amulet: null,
  chest: null,
  gloves: null,
  belt: null,
  boots: null,
  weapon: null,
  offhand: null,
  ring1: null,
  ring2: null,
};

const initialState: GameState = {
  screen: 'menu',
  character: null,
  currentRoom: null,
  currentEncounter: null,
  currentPathId: null,
  combat: null,
  dungeonFloor: 1,
  roomsCleared: 0,
  discoveredRooms: [],
  lastDirection: null,
  clearedPathIds: [],
  pathToRoom: {},
};

type GameAction =
  | { type: 'SET_SCREEN'; screen: GameScreen }
  | { type: 'CREATE_CHARACTER'; name: string; characterClass: CharacterClass }
  | { type: 'LOAD_GAME'; state: GameState }
  | { type: 'ENTER_DUNGEON' }
  | { type: 'CHOOSE_PATH'; encounterType: EncounterType; direction: PathDirection; pathId: string }
  | { type: 'START_COMBAT'; enemy: Enemy }
  | { type: 'COMBAT_ACTION'; action: 'attack' | 'defend' | 'potion' | 'mana_potion' | 'flee' }
  | { type: 'COMBAT_TICK'; deltaTime: number } // Semi-idle combat tick
  | { type: 'PLAYER_AUTO_ATTACK' } // Triggered when player action bar fills
  | { type: 'ENEMY_AUTO_ATTACK' } // Triggered when enemy action bar fills
  | { type: 'TOGGLE_COMBAT_PAUSE' } // Pause/unpause combat
  | { type: 'END_COMBAT'; victory: boolean }
  | { type: 'TAKE_DAMAGE'; amount: number }
  | { type: 'HEAL'; amount: number }
  | { type: 'ADD_GOLD'; amount: number }
  | { type: 'ADD_EXPERIENCE'; amount: number }
  | { type: 'ADD_ITEM'; item: Item }
  | { type: 'ADD_LOOT_ITEM'; item: LootItem }
  | { type: 'EQUIP_ITEM'; item: Item }
  | { type: 'EQUIP_LOOT_ITEM'; item: LootItem; targetSlot?: EquipmentSlot }
  | { type: 'UNEQUIP_ITEM'; slot: EquipmentSlot }
  | { type: 'DROP_ITEM'; itemId: string }
  | { type: 'USE_POTION'; item: Item }
  | { type: 'BUY_ITEM'; item: Item }
  | { type: 'NEXT_ROOM' }
  | { type: 'BACKTRACK_TO_ROOM'; roomId: string }
  | { type: 'MARK_PATH_CLEARED'; pathId: string }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_COMBAT_LOG'; message: string }
  | { type: 'SPEND_ATTRIBUTE_POINT'; attribute: keyof PrimaryAttributes }
  | { type: 'LEARN_SKILL'; skillId: string }
  | { type: 'USE_SKILL'; skillId: string };

function calculateDamage(attacker: number, defender: number): number {
  const baseDamage = Math.max(1, attacker - defender / 2);
  const variance = Math.floor(Math.random() * 5) - 2;
  return Math.max(1, Math.floor(baseDamage + variance));
}

// Check for critical hit based on crit chance
function rollCritical(critChance: number): boolean {
  return Math.random() * 100 < critChance;
}

// Check for dodge based on dodge chance
function rollDodge(dodgeChance: number): boolean {
  return Math.random() * 100 < dodgeChance;
}

function checkLevelUp(character: Character): Character {
  // Check if already at max level
  if (character.stats.level >= MAX_LEVEL) {
    // Cap experience at 0 when at max level
    return {
      ...character,
      stats: {
        ...character.stats,
        experience: 0,
      },
    };
  }
  
  const expNeeded = character.stats.level * 100;
  if (character.stats.experience >= expNeeded) {
    const newLevel = Math.min(character.stats.level + 1, MAX_LEVEL);
    const growth = CLASS_ATTRIBUTE_GROWTH[character.class];
    
    // Apply attribute growth
    const newAttributes: PrimaryAttributes = {
      strength: character.attributes.strength + (growth.strength || 0),
      dexterity: character.attributes.dexterity + (growth.dexterity || 0),
      vitality: character.attributes.vitality + (growth.vitality || 0),
      intelligence: character.attributes.intelligence + (growth.intelligence || 0),
      charisma: character.attributes.charisma + (growth.charisma || 0),
    };
    
    // Recalculate derived stats from new attributes
    const newDerivedStats = calculateDerivedStats(newAttributes, newLevel);
    
    // If we just hit max level, don't carry over excess experience
    const remainingExp = newLevel >= MAX_LEVEL ? 0 : character.stats.experience - expNeeded;
    
    return {
      ...character,
      attributes: newAttributes,
      attributePoints: character.attributePoints + ATTRIBUTE_POINTS_PER_LEVEL,
      skillPoints: character.skillPoints + SKILL_POINTS_PER_LEVEL,
      stats: {
        ...newDerivedStats,
        level: newLevel,
        experience: remainingExp,
        gold: character.stats.gold,
        health: newDerivedStats.maxHealth, // Full heal on level up
        mana: newDerivedStats.maxMana, // Full mana restore on level up
      },
    };
  }
  return character;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };

    case 'CREATE_CHARACTER': {
      // Clear any saved game when creating a new character
      localStorage.removeItem(STORAGE_KEY);
      
      // Generate unique session ID for this playthrough
      const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const baseStats = CLASS_BASE_STATS[action.characterClass];
      const baseAttributes = CLASS_BASE_ATTRIBUTES[action.characterClass];
      
      // Generate starting potions as LootItems
      const startingHealthPotion1: LootItem = {
        id: `potion-${sessionId}-1`,
        name: 'Minor Health Potion',
        baseName: 'Health Potion',
        slot: 'consumable',
        rarity: 'normal',
        level: 1,
        requiredLevel: 0,
        mods: [{ type: 'health', value: 30, description: 'Restores 30 HP' }],
        value: 25,
        icon: '🧪',
      };
      const startingHealthPotion2: LootItem = { ...startingHealthPotion1, id: `potion-${sessionId}-2` };
      const startingManaPotion: LootItem = {
        id: `mana-potion-${sessionId}-1`,
        name: 'Minor Mana Potion',
        baseName: 'Mana Potion',
        slot: 'consumable',
        rarity: 'normal',
        level: 1,
        requiredLevel: 0,
        mods: [{ type: 'mana', value: 25, description: 'Restores 25 MP' }],
        value: 30,
        icon: '💧',
      };
      
      // Generate a starter weapon based on class
      const starterWeapon = generateLootItem(1, 'weapon', 'uncommon');
      
      const character: Character = {
        name: action.name,
        class: action.characterClass,
        stats: {
          ...baseStats,
          gold: 50,
          experience: 0,
          level: 1,
        },
        attributes: { ...baseAttributes },
        attributePoints: 0,
        skillPoints: STARTING_SKILL_POINTS,
        skills: [],
        equippedWeapon: null,
        equippedArmor: null,
        inventory: [startingHealthPotion1, startingHealthPotion2, startingManaPotion, starterWeapon],
        equippedItems: { ...EMPTY_EQUIPPED },
      };
      
      // Return a completely fresh state with the Monastery dungeon
      return {
        screen: 'dungeon',
        character,
        currentRoom: getMonasteryStartRoom(), // Use hand-crafted monastery dungeon
        currentEncounter: null,
        currentPathId: null,
        combat: null,
        dungeonFloor: 1,
        roomsCleared: 0,
        discoveredRooms: [],
        lastDirection: null,
        clearedPathIds: [],
        pathToRoom: {},
      };
    }

    case 'LOAD_GAME':
      return action.state;

    case 'ENTER_DUNGEON':
      return {
        ...state,
        screen: 'dungeon',
        currentRoom: getMonasteryStartRoom(), // Use hand-crafted monastery dungeon
      };

    case 'CHOOSE_PATH': {
      // Check if we're in an already discovered room (backtracked)
      const currentRoomIndex = state.discoveredRooms.findIndex(r => r.id === state.currentRoom?.id);
      
      let updatedDiscoveredRooms = [...state.discoveredRooms];
      
      if (currentRoomIndex >= 0) {
        // We're in a discovered room - just update the direction taken, don't remove any rooms
        updatedDiscoveredRooms[currentRoomIndex] = {
          ...updatedDiscoveredRooms[currentRoomIndex],
          directionTaken: action.direction,
        };
      } else if (state.currentRoom) {
        // New room - add it to discovered rooms (only if not already there)
        const alreadyDiscovered = state.discoveredRooms.some(r => r.id === state.currentRoom?.id);
        if (!alreadyDiscovered) {
          const newDiscoveredRoom: DiscoveredRoom = {
            ...state.currentRoom,
            directionTaken: action.direction,
            visited: true,
          };
          updatedDiscoveredRooms = [...state.discoveredRooms, newDiscoveredRoom];
        }
      }
      
      // Check if the path is already cleared (except merchants and battles which always trigger)
      const isPathCleared = state.clearedPathIds.includes(action.pathId);
      const isMerchant = action.encounterType === 'merchant';
      const isBattle = action.encounterType === 'battle';
      // Battles always happen (new enemy spawns), merchants always available, only treasure/other skipped
      const shouldSkipEvent = isPathCleared && !isMerchant && !isBattle;
      
      // If path is cleared (not merchant or battle), skip directly to encounter screen with cleared state
      if (shouldSkipEvent) {
        return {
          ...state,
          currentEncounter: action.encounterType,
          currentPathId: action.pathId,
          screen: 'encounter', // Always go to encounter for cleared paths (shows "already cleared" message)
          lastDirection: action.direction,
          discoveredRooms: updatedDiscoveredRooms,
          combat: null,
        };
      }
      
      return {
        ...state,
        currentEncounter: action.encounterType,
        currentPathId: action.pathId,
        screen: action.encounterType === 'battle' ? 'combat' : 'encounter',
        lastDirection: action.direction,
        discoveredRooms: updatedDiscoveredRooms,
        combat: action.encounterType === 'battle' 
          ? {
              enemy: generateEnemy(state.dungeonFloor),
              playerTurn: true,
              combatLog: ['A foe appears!'],
              isDefending: false,
              activeBuffs: [],
              enemyDebuffs: [],
              playerDebuffs: [],
              enemyBuffs: [],
              shieldAmount: 0,
              isStunned: false,
              playerActionBar: 0,
              enemyActionBar: 0,
              isPaused: false,
              lastTickTime: Date.now(),
            }
          : null,
      };
    }

    case 'START_COMBAT':
      return {
        ...state,
        screen: 'combat',
        combat: {
          enemy: action.enemy,
          playerTurn: true,
          combatLog: [`${action.enemy.name} attacks!`],
          isDefending: false,
          activeBuffs: [],
          enemyDebuffs: [],
          playerDebuffs: [],
          enemyBuffs: [],
          shieldAmount: 0,
          isStunned: false,
          playerActionBar: 0,
          enemyActionBar: 0,
          isPaused: false,
          lastTickTime: Date.now(),
        },
      };

    case 'COMBAT_ACTION': {
      if (!state.combat || !state.character) return state;
      
      const { enemy } = state.combat;
      let newCombat = { ...state.combat };
      let newCharacter = { ...state.character };
      let newLog = [...state.combat.combatLog];

      if (action.action === 'flee') {
        const fleeChance = Math.random();
        if (fleeChance > 0.5) {
          newLog.push('You fled successfully!');
          return {
            ...state,
            screen: 'dungeon',
            combat: null,
            currentRoom: generateRoom(state.dungeonFloor),
          };
        } else {
          newLog.push('Failed to flee!');
        }
      } else if (action.action === 'attack') {
        // Manual attack is no longer used - auto-attacks handle this
        // Keep for backwards compatibility but do nothing
      } else if (action.action === 'defend') {
        // Toggle defending state
        newCombat.isDefending = !newCombat.isDefending;
        if (newCombat.isDefending) {
          newLog.push('You raise your guard!');
        } else {
          newLog.push('You lower your guard.');
        }
      } else if (action.action === 'potion') {
        // Find a consumable potion (LootItem with slot 'consumable' that heals)
        const potion = newCharacter.inventory.find(i => 
          i.slot === 'consumable' && i.mods.some(m => m.type === 'health')
        );
        if (potion) {
          const healthMod = potion.mods.find(m => m.type === 'health');
          const healValue = healthMod?.value || 30;
          const healAmount = Math.min(
            healValue,
            newCharacter.stats.maxHealth - newCharacter.stats.health
          );
          newCharacter = {
            ...newCharacter,
            stats: {
              ...newCharacter.stats,
              health: newCharacter.stats.health + healAmount,
            },
            inventory: newCharacter.inventory.filter(i => i.id !== potion.id),
          };
          newLog.push(`Healed for ${healAmount} HP!`);
        }
      } else if (action.action === 'mana_potion') {
        // Find a mana potion (LootItem with slot 'consumable' that restores mana)
        const manaPotion = newCharacter.inventory.find(i => 
          i.slot === 'consumable' && i.mods.some(m => m.type === 'mana')
        );
        if (manaPotion) {
          const manaMod = manaPotion.mods.find(m => m.type === 'mana');
          const manaValue = manaMod?.value || 25;
          const manaRestored = Math.min(
            manaValue,
            newCharacter.stats.maxMana - newCharacter.stats.mana
          );
          newCharacter = {
            ...newCharacter,
            stats: {
              ...newCharacter.stats,
              mana: newCharacter.stats.mana + manaRestored,
            },
            inventory: newCharacter.inventory.filter(i => i.id !== manaPotion.id),
          };
          newLog.push(`Restored ${manaRestored} MP!`);
        }
      }

      // Check if enemy defeated
      if (newCombat.enemy.health <= 0) {
        const expGain = Math.floor(enemy.expReward * (1 + newCharacter.stats.expBonus / 100));
        const goldGain = Math.floor(enemy.goldReward * (1 + newCharacter.stats.goldFind / 100));
        newCharacter = {
          ...newCharacter,
          stats: {
            ...newCharacter.stats,
            gold: newCharacter.stats.gold + goldGain,
            experience: newCharacter.stats.experience + expGain,
          },
          // Reset all skill cooldowns after combat
          skills: newCharacter.skills.map(s => ({ ...s, currentCooldown: 0 })),
        };
        newCharacter = checkLevelUp(newCharacter);
        newLog.push(`Victory! +${goldGain} gold, +${expGain} exp`);
        
        return {
          ...state,
          character: newCharacter,
          combat: { ...newCombat, combatLog: newLog },
          screen: 'victory',
        };
      }

      // Semi-idle: actions don't trigger enemy turns anymore
      // Just return the updated state
      return {
        ...state,
        character: newCharacter,
        combat: { ...newCombat, combatLog: newLog },
      };
    }

    case 'COMBAT_TICK': {
      if (!state.combat || !state.character || state.combat.isPaused) return state;
      
      const { deltaTime } = action;
      const dexterity = state.character.attributes.dexterity;
      
      // Base fill rate: 8 per second, DEX adds 0.3 per point (slower combat)
      const playerFillRate = 8 + (dexterity * 0.3);
      // Enemy fill rate is fixed based on dungeon floor
      const enemyFillRate = 6 + (state.dungeonFloor * 0.3);
      
      const newPlayerBar = Math.min(100, state.combat.playerActionBar + (playerFillRate * deltaTime / 1000));
      const newEnemyBar = Math.min(100, state.combat.enemyActionBar + (enemyFillRate * deltaTime / 1000));
      
      // Tick down skill cooldowns in real-time (cooldown is in seconds)
      const newSkills = state.character.skills.map(s => ({
        ...s,
        currentCooldown: Math.max(0, s.currentCooldown - deltaTime / 1000),
      }));
      
      // Tick down buff/debuff durations in real-time
      const tickedBuffs = state.combat.activeBuffs
        .map(b => ({ ...b, remainingTurns: b.remainingTurns - deltaTime / 1000 }))
        .filter(b => b.remainingTurns > 0);
      
      const tickedDebuffs = state.combat.enemyDebuffs
        .map(d => ({ ...d, remainingTurns: d.remainingTurns - deltaTime / 1000 }))
        .filter(d => d.remainingTurns > 0);
      
      // Tick down player debuffs (poison, weaken, etc.)
      const tickedPlayerDebuffs = state.combat.playerDebuffs
        .map(d => ({ ...d, remainingTurns: d.remainingTurns - deltaTime / 1000 }))
        .filter(d => d.remainingTurns > 0);
      
      // Tick down enemy buffs (enrage, etc.)
      const tickedEnemyBuffs = state.combat.enemyBuffs
        .map(b => ({ ...b, remainingTurns: b.remainingTurns - deltaTime / 1000 }))
        .filter(b => b.remainingTurns > 0);
      
      // Apply bleed damage over time to enemy
      let newEnemy = { ...state.combat.enemy };
      let newLog = [...state.combat.combatLog];
      const bleedEffects = state.combat.enemyDebuffs.filter(d => d.effectType === 'bleed');
      for (const bleed of bleedEffects) {
        const bleedDamage = Math.floor(bleed.value * deltaTime / 1000);
        if (bleedDamage > 0) {
          newEnemy = { ...newEnemy, health: newEnemy.health - bleedDamage };
        }
      }
      
      // Apply poison damage over time to player
      let newCharacter = { ...state.character, skills: newSkills };
      const poisonEffects = state.combat.playerDebuffs.filter(d => d.effectType === 'poison');
      for (const poison of poisonEffects) {
        const poisonDamage = Math.floor(poison.value * deltaTime / 1000);
        if (poisonDamage > 0) {
          newCharacter = {
            ...newCharacter,
            stats: {
              ...newCharacter.stats,
              health: Math.max(1, newCharacter.stats.health - poisonDamage),
            },
          };
        }
      }
      
      // Check if enemy died from bleed
      if (newEnemy.health <= 0) {
        const expGain = Math.floor(state.combat.enemy.expReward * (1 + state.character.stats.expBonus / 100));
        const goldGain = Math.floor(state.combat.enemy.goldReward * (1 + state.character.stats.goldFind / 100));
        newCharacter = {
          ...newCharacter,
          stats: {
            ...newCharacter.stats,
            gold: newCharacter.stats.gold + goldGain,
            experience: newCharacter.stats.experience + expGain,
          },
          skills: newSkills.map(s => ({ ...s, currentCooldown: 0 })),
        };
        newCharacter = checkLevelUp(newCharacter);
        newLog.push(`Victory! +${goldGain} gold, +${expGain} exp`);
        
        return {
          ...state,
          character: newCharacter,
          combat: { ...state.combat, enemy: newEnemy, combatLog: newLog },
          screen: 'victory',
        };
      }
      
      return {
        ...state,
        character: newCharacter,
        combat: {
          ...state.combat,
          playerActionBar: newPlayerBar,
          enemyActionBar: newEnemyBar,
          activeBuffs: tickedBuffs,
          enemyDebuffs: tickedDebuffs,
          playerDebuffs: tickedPlayerDebuffs,
          enemyBuffs: tickedEnemyBuffs,
          enemy: newEnemy,
          lastTickTime: Date.now(),
        },
      };
    }

    case 'PLAYER_AUTO_ATTACK': {
      if (!state.combat || !state.character) return state;
      
      // Check if player is stunned
      if (state.combat.isStunned) {
        const newLog = [...state.combat.combatLog, 'You are stunned and cannot attack!'];
        return {
          ...state,
          combat: { ...state.combat, combatLog: newLog, playerActionBar: 0, isStunned: false },
        };
      }
      
      const { enemy } = state.combat;
      let newCharacter = { ...state.character };
      let newLog = [...state.combat.combatLog];
      
      const weaponBonus = newCharacter.equippedWeapon?.effect || 0;
      let baseAttack = newCharacter.stats.attack + weaponBonus;
      
      // Apply attack buffs
      const attackBuffs = state.combat.activeBuffs.filter(b => b.effectType === 'buff_attack');
      if (attackBuffs.length > 0) {
        const totalAttackBonus = attackBuffs.reduce((sum, b) => sum + b.value, 0);
        baseAttack = Math.floor(baseAttack * (1 + totalAttackBonus / 100));
      }
      
      // Apply weaken debuff (reduces player attack)
      const weakenDebuffs = state.combat.playerDebuffs.filter(d => d.effectType === 'debuff_attack');
      if (weakenDebuffs.length > 0) {
        const totalWeakenReduction = weakenDebuffs.reduce((sum, d) => sum + d.value, 0);
        baseAttack = Math.floor(baseAttack * (1 - totalWeakenReduction / 100));
      }
      
      // Apply crit buffs
      let critChance = newCharacter.stats.critChance;
      const critBuffs = state.combat.activeBuffs.filter(b => b.effectType === 'buff_crit');
      if (critBuffs.length > 0) {
        critChance += critBuffs.reduce((sum, b) => sum + b.value, 0);
      }
      
      // Check for critical hit
      const isCrit = rollCritical(critChance);
      const critMultiplier = isCrit ? (newCharacter.stats.critDamage / 100) : 1;
      
      // Apply enemy defense debuffs
      let enemyDefense = enemy.defense;
      const defenseDebuffs = state.combat.enemyDebuffs.filter(d => d.effectType === 'debuff_defense');
      if (defenseDebuffs.length > 0) {
        const totalDefenseReduction = defenseDebuffs.reduce((sum, d) => sum + d.value, 0);
        enemyDefense = Math.max(0, enemyDefense - totalDefenseReduction);
      }
      
      const damage = Math.floor(calculateDamage(baseAttack, enemyDefense) * critMultiplier);
      let newEnemy = { ...enemy, health: enemy.health - damage };
      
      if (isCrit) {
        newLog.push(`CRITICAL HIT! You deal ${damage} damage!`);
      } else {
        newLog.push(`You deal ${damage} damage!`);
      }
      
      // Life steal
      if (newCharacter.stats.lifeSteal > 0) {
        const healAmount = Math.floor(damage * (newCharacter.stats.lifeSteal / 100));
        if (healAmount > 0) {
          newCharacter = {
            ...newCharacter,
            stats: {
              ...newCharacter.stats,
              health: Math.min(newCharacter.stats.maxHealth, newCharacter.stats.health + healAmount),
            },
          };
          newLog.push(`Life steal heals you for ${healAmount} HP!`);
        }
      }
      
      // Check if enemy defeated
      if (newEnemy.health <= 0) {
        const expGain = Math.floor(enemy.expReward * (1 + newCharacter.stats.expBonus / 100));
        const goldGain = Math.floor(enemy.goldReward * (1 + newCharacter.stats.goldFind / 100));
        newCharacter = {
          ...newCharacter,
          stats: {
            ...newCharacter.stats,
            gold: newCharacter.stats.gold + goldGain,
            experience: newCharacter.stats.experience + expGain,
          },
          skills: newCharacter.skills.map(s => ({ ...s, currentCooldown: 0 })),
        };
        newCharacter = checkLevelUp(newCharacter);
        newLog.push(`Victory! +${goldGain} gold, +${expGain} exp`);
        
        return {
          ...state,
          character: newCharacter,
          combat: { ...state.combat, enemy: newEnemy, combatLog: newLog, playerActionBar: 0 },
          screen: 'victory',
        };
      }
      
      return {
        ...state,
        character: newCharacter,
        combat: { ...state.combat, enemy: newEnemy, combatLog: newLog, playerActionBar: 0 },
      };
    }

    case 'ENEMY_AUTO_ATTACK': {
      if (!state.combat || !state.character) return state;
      
      const { enemy } = state.combat;
      let newCharacter = { ...state.character };
      let newLog = [...state.combat.combatLog];
      let newCombat = { ...state.combat };
      let newEnemy = { ...enemy };
      
      // Check if enemy uses a special ability
      let usedAbility = false;
      let abilityUsed: { type: string; description: string } | null = null;
      
      if (enemy.abilities && enemy.abilities.length > 0) {
        for (const ability of enemy.abilities) {
          if (Math.random() * 100 < ability.chance) {
            usedAbility = true;
            abilityUsed = { type: ability.type, description: ability.description };
            
            switch (ability.type) {
              case 'poison':
                // Add poison debuff to player
                const existingPoison = newCombat.playerDebuffs.find(d => d.effectType === 'poison');
                if (!existingPoison) {
                  newCombat.playerDebuffs = [...newCombat.playerDebuffs, {
                    skillId: `enemy-${ability.type}`,
                    effectType: 'poison',
                    value: ability.value,
                    remainingTurns: ability.duration || 5,
                    isDebuff: true,
                  }];
                  newLog.push(`⚡ ${enemy.name} uses ${ability.description}! You are poisoned!`);
                } else {
                  newLog.push(`⚡ ${enemy.name} uses ${ability.description}! (Poison already active)`);
                }
                break;
                
              case 'stun':
                newCombat.isStunned = true;
                newLog.push(`⚡ ${enemy.name} uses ${ability.description}! You are stunned!`);
                break;
                
              case 'multi_hit':
                // Will attack multiple times - handled below
                newLog.push(`⚡ ${enemy.name} uses ${ability.description}!`);
                break;
                
              case 'lifesteal':
                // Log will be added when damage is dealt
                newLog.push(`⚡ ${enemy.name} prepares ${ability.description}!`);
                break;
                
              case 'enrage':
                const existingEnrage = newCombat.enemyBuffs.find(b => b.effectType === 'enrage');
                if (!existingEnrage) {
                  newCombat.enemyBuffs = [...newCombat.enemyBuffs, {
                    skillId: `enemy-${ability.type}`,
                    effectType: 'enrage',
                    value: ability.value,
                    remainingTurns: ability.duration || 5,
                    isDebuff: false,
                  }];
                  newLog.push(`⚡ ${enemy.name} uses ${ability.description}! Attack increased!`);
                } else {
                  newLog.push(`⚡ ${enemy.name} uses ${ability.description}! (Already enraged)`);
                }
                break;
                
              case 'weaken':
                const existingWeaken = newCombat.playerDebuffs.find(d => d.effectType === 'debuff_attack');
                if (!existingWeaken) {
                  newCombat.playerDebuffs = [...newCombat.playerDebuffs, {
                    skillId: `enemy-${ability.type}`,
                    effectType: 'debuff_attack',
                    value: ability.value,
                    remainingTurns: ability.duration || 4,
                    isDebuff: true,
                  }];
                  newLog.push(`⚡ ${enemy.name} uses ${ability.description}! Your attack is weakened!`);
                } else {
                  newLog.push(`⚡ ${enemy.name} uses ${ability.description}! (Already weakened)`);
                }
                break;
            }
            
            // Only use one ability per attack
            if (ability.type !== 'multi_hit' && ability.type !== 'lifesteal') {
              break;
            }
          }
        }
      }
      
      // Calculate how many hits
      const multiHitAbility = enemy.abilities?.find(a => a.type === 'multi_hit');
      const hitCount = (usedAbility && abilityUsed?.type === 'multi_hit' && multiHitAbility) 
        ? multiHitAbility.value 
        : 1;
      
      // Check for player dodge
      const didDodge = rollDodge(newCharacter.stats.dodge);
      
      if (didDodge) {
        newLog.push(`You dodged ${enemy.name}'s attack!`);
      } else {
        // Calculate enemy attack with enrage buff
        let enemyAttack = enemy.attack;
        const enrageBuffs = newCombat.enemyBuffs.filter(b => b.effectType === 'enrage');
        if (enrageBuffs.length > 0) {
          const totalEnrageBonus = enrageBuffs.reduce((sum, b) => sum + b.value, 0);
          enemyAttack = Math.floor(enemyAttack * (1 + totalEnrageBonus / 100));
        }
        
        const armorBonus = newCharacter.equippedArmor?.effect || 0;
        const defenseMultiplier = newCombat.isDefending ? 2 : 1;
        
        let totalDamage = 0;
        
        for (let i = 0; i < hitCount; i++) {
          let enemyDamage = calculateDamage(
            enemyAttack,
            (newCharacter.stats.defense + armorBonus) * defenseMultiplier
          );
          
          // Apply defense buffs
          const defenseBuffs = newCombat.activeBuffs.filter(b => b.effectType === 'buff_defense');
          if (defenseBuffs.length > 0) {
            const totalDefenseBonus = defenseBuffs.reduce((sum, b) => sum + b.value, 0);
            enemyDamage = Math.floor(enemyDamage * (1 - totalDefenseBonus / 100));
          }
          
          // Apply shield absorption
          if (newCombat.shieldAmount > 0) {
            const shieldAbsorb = Math.min(newCombat.shieldAmount, enemyDamage);
            enemyDamage -= shieldAbsorb;
            newCombat.shieldAmount -= shieldAbsorb;
            if (shieldAbsorb > 0 && i === 0) {
              newLog.push(`Shield absorbs ${shieldAbsorb} damage!`);
            }
          }
          
          totalDamage += enemyDamage;
        }
        
        if (totalDamage > 0) {
          newCharacter = {
            ...newCharacter,
            stats: {
              ...newCharacter.stats,
              health: newCharacter.stats.health - totalDamage,
            },
          };
          
          if (hitCount > 1) {
            newLog.push(`${enemy.name} hits ${hitCount} times for ${totalDamage} total damage!`);
          } else {
            newLog.push(`${enemy.name} deals ${totalDamage} damage!`);
          }
          
          // Lifesteal ability
          const lifestealAbility = enemy.abilities?.find(a => a.type === 'lifesteal');
          if (lifestealAbility && Math.random() * 100 < lifestealAbility.chance) {
            const healAmount = Math.floor(totalDamage * (lifestealAbility.value / 100));
            if (healAmount > 0) {
              newEnemy = {
                ...newEnemy,
                health: Math.min(newEnemy.maxHealth, newEnemy.health + healAmount),
              };
              newLog.push(`${enemy.name} drains ${healAmount} HP!`);
            }
          }
        }
      }
      
      // Reset defending after enemy attack
      newCombat.isDefending = false;
      
      // Check if player defeated
      if (newCharacter.stats.health <= 0) {
        return {
          ...state,
          character: newCharacter,
          combat: { ...newCombat, enemy: newEnemy, combatLog: newLog, enemyActionBar: 0 },
          screen: 'game-over',
        };
      }
      
      return {
        ...state,
        character: newCharacter,
        combat: { ...newCombat, enemy: newEnemy, combatLog: newLog, enemyActionBar: 0 },
      };
    }

    case 'TOGGLE_COMBAT_PAUSE': {
      if (!state.combat) return state;
      return {
        ...state,
        combat: {
          ...state.combat,
          isPaused: !state.combat.isPaused,
          lastTickTime: Date.now(),
        },
      };
    }

    case 'TAKE_DAMAGE':
      if (!state.character) return state;
      const newHealth = state.character.stats.health - action.amount;
      if (newHealth <= 0) {
        return {
          ...state,
          character: {
            ...state.character,
            stats: { ...state.character.stats, health: 0 },
          },
          screen: 'game-over',
        };
      }
      return {
        ...state,
        character: {
          ...state.character,
          stats: { ...state.character.stats, health: newHealth },
        },
      };

    case 'HEAL':
      if (!state.character) return state;
      return {
        ...state,
        character: {
          ...state.character,
          stats: {
            ...state.character.stats,
            health: Math.min(
              state.character.stats.maxHealth,
              state.character.stats.health + action.amount
            ),
          },
        },
      };

    case 'ADD_GOLD':
      if (!state.character) return state;
      return {
        ...state,
        character: {
          ...state.character,
          stats: {
            ...state.character.stats,
            gold: state.character.stats.gold + action.amount,
          },
        },
      };

    case 'ADD_EXPERIENCE':
      if (!state.character) return state;
      let updatedChar = {
        ...state.character,
        stats: {
          ...state.character.stats,
          experience: state.character.stats.experience + action.amount,
        },
      };
      updatedChar = checkLevelUp(updatedChar);
      return { ...state, character: updatedChar };

    case 'ADD_ITEM':
      // Convert old Item to LootItem format
      if (!state.character) return state;
      const convertedItem: LootItem = {
        id: action.item.id,
        name: action.item.name,
        baseName: action.item.name,
        slot: action.item.type === 'weapon' ? 'weapon' : action.item.type === 'armor' ? 'chest' : 'consumable',
        rarity: 'normal',
        level: 1,
        requiredLevel: action.item.type === 'potion' ? 0 : 1,
        mods: [{
          type: action.item.type === 'weapon' ? 'attack' : action.item.type === 'armor' ? 'defense' : 'health',
          value: action.item.effect,
          description: action.item.description,
        }],
        value: action.item.value,
        icon: action.item.type === 'weapon' ? '⚔️' : action.item.type === 'armor' ? '🛡️' : '🧪',
      };
      return {
        ...state,
        character: {
          ...state.character,
          inventory: [...state.character.inventory, convertedItem],
        },
      };

    case 'ADD_LOOT_ITEM':
      if (!state.character) return state;
      return {
        ...state,
        character: {
          ...state.character,
          inventory: [...state.character.inventory, action.item],
        },
      };

    case 'EQUIP_ITEM':
      if (!state.character) return state;
      const isWeapon = action.item.type === 'weapon';
      return {
        ...state,
        character: {
          ...state.character,
          equippedWeapon: isWeapon ? action.item : state.character.equippedWeapon,
          equippedArmor: !isWeapon ? action.item : state.character.equippedArmor,
        },
      };

    case 'EQUIP_LOOT_ITEM': {
      if (!state.character || action.item.slot === 'consumable') return state;
      
      // Check level requirement
      if (action.item.requiredLevel > state.character.stats.level) {
        console.warn(`Cannot equip ${action.item.name}: requires level ${action.item.requiredLevel}`);
        return state;
      }
      
      let slot = action.item.slot as EquipmentSlot;
      
      // Handle rings - use target slot if specified, otherwise auto-select
      if (slot === 'ring1' || slot === 'ring2') {
        if (action.targetSlot === 'ring1' || action.targetSlot === 'ring2') {
          // Use the explicitly specified target slot
          slot = action.targetSlot;
        } else {
          // Auto-select: try to equip in an empty ring slot first, otherwise use ring1
          if (!state.character.equippedItems.ring1) {
            slot = 'ring1';
          } else if (!state.character.equippedItems.ring2) {
            slot = 'ring2';
          } else {
            // Both slots full, default to ring1 (will swap)
            slot = 'ring1';
          }
        }
      }
      
      const currentEquipped = state.character.equippedItems[slot];
      
      // Calculate stat bonuses
      let attackBonus = 0;
      let defenseBonus = 0;
      let maxHealthBonus = 0;
      let magicAttackBonus = 0;
      let magicDefenseBonus = 0;
      let maxManaBonus = 0;
      let critChanceBonus = 0;
      let critDamageBonus = 0;
      let dodgeBonus = 0;
      let lifeStealBonus = 0;
      let goldFindBonus = 0;
      let expBonusBonus = 0;
      
      action.item.mods.forEach(mod => {
        if (mod.type === 'attack') attackBonus += mod.value;
        if (mod.type === 'defense') defenseBonus += mod.value;
        if (mod.type === 'maxHealth') maxHealthBonus += mod.value;
        if (mod.type === 'magicAttack') magicAttackBonus += mod.value;
        if (mod.type === 'magicDefense') magicDefenseBonus += mod.value;
        if (mod.type === 'maxMana') maxManaBonus += mod.value;
        if (mod.type === 'critChance') critChanceBonus += mod.value;
        if (mod.type === 'critDamage') critDamageBonus += mod.value;
        if (mod.type === 'dodge') dodgeBonus += mod.value;
        if (mod.type === 'lifeSteal') lifeStealBonus += mod.value;
        if (mod.type === 'goldFind') goldFindBonus += mod.value;
        if (mod.type === 'expBonus') expBonusBonus += mod.value;
      });
      
      // Remove old item stats if unequipping
      if (currentEquipped) {
        currentEquipped.mods.forEach(mod => {
          if (mod.type === 'attack') attackBonus -= mod.value;
          if (mod.type === 'defense') defenseBonus -= mod.value;
          if (mod.type === 'maxHealth') maxHealthBonus -= mod.value;
          if (mod.type === 'magicAttack') magicAttackBonus -= mod.value;
          if (mod.type === 'magicDefense') magicDefenseBonus -= mod.value;
          if (mod.type === 'maxMana') maxManaBonus -= mod.value;
          if (mod.type === 'critChance') critChanceBonus -= mod.value;
          if (mod.type === 'critDamage') critDamageBonus -= mod.value;
          if (mod.type === 'dodge') dodgeBonus -= mod.value;
          if (mod.type === 'lifeSteal') lifeStealBonus -= mod.value;
          if (mod.type === 'goldFind') goldFindBonus -= mod.value;
          if (mod.type === 'expBonus') expBonusBonus -= mod.value;
        });
      }
      
      return {
        ...state,
        character: {
          ...state.character,
          stats: {
            ...state.character.stats,
            attack: state.character.stats.attack + attackBonus,
            defense: state.character.stats.defense + defenseBonus,
            maxHealth: state.character.stats.maxHealth + maxHealthBonus,
            magicAttack: state.character.stats.magicAttack + magicAttackBonus,
            magicDefense: state.character.stats.magicDefense + magicDefenseBonus,
            maxMana: state.character.stats.maxMana + maxManaBonus,
            critChance: state.character.stats.critChance + critChanceBonus,
            critDamage: state.character.stats.critDamage + critDamageBonus,
            dodge: state.character.stats.dodge + dodgeBonus,
            lifeSteal: state.character.stats.lifeSteal + lifeStealBonus,
            goldFind: state.character.stats.goldFind + goldFindBonus,
            expBonus: state.character.stats.expBonus + expBonusBonus,
          },
          equippedItems: {
            ...state.character.equippedItems,
            [slot]: action.item,
          },
          inventory: [
            ...state.character.inventory.filter(i => i.id !== action.item.id),
            ...(currentEquipped ? [currentEquipped] : []),
          ],
        },
      };
    }

    case 'UNEQUIP_ITEM': {
      if (!state.character) return state;
      const currentItem = state.character.equippedItems[action.slot];
      if (!currentItem) return state;
      
      // Remove stat bonuses
      let attackBonus = 0;
      let defenseBonus = 0;
      let maxHealthBonus = 0;
      let magicAttackBonus = 0;
      let magicDefenseBonus = 0;
      let maxManaBonus = 0;
      let critChanceBonus = 0;
      let critDamageBonus = 0;
      let dodgeBonus = 0;
      let lifeStealBonus = 0;
      let goldFindBonus = 0;
      let expBonusBonus = 0;
      
      currentItem.mods.forEach(mod => {
        if (mod.type === 'attack') attackBonus -= mod.value;
        if (mod.type === 'defense') defenseBonus -= mod.value;
        if (mod.type === 'maxHealth') maxHealthBonus -= mod.value;
        if (mod.type === 'magicAttack') magicAttackBonus -= mod.value;
        if (mod.type === 'magicDefense') magicDefenseBonus -= mod.value;
        if (mod.type === 'maxMana') maxManaBonus -= mod.value;
        if (mod.type === 'critChance') critChanceBonus -= mod.value;
        if (mod.type === 'critDamage') critDamageBonus -= mod.value;
        if (mod.type === 'dodge') dodgeBonus -= mod.value;
        if (mod.type === 'lifeSteal') lifeStealBonus -= mod.value;
        if (mod.type === 'goldFind') goldFindBonus -= mod.value;
        if (mod.type === 'expBonus') expBonusBonus -= mod.value;
      });
      
      return {
        ...state,
        character: {
          ...state.character,
          stats: {
            ...state.character.stats,
            attack: state.character.stats.attack + attackBonus,
            defense: state.character.stats.defense + defenseBonus,
            maxHealth: state.character.stats.maxHealth + maxHealthBonus,
            magicAttack: state.character.stats.magicAttack + magicAttackBonus,
            magicDefense: state.character.stats.magicDefense + magicDefenseBonus,
            maxMana: state.character.stats.maxMana + maxManaBonus,
            critChance: state.character.stats.critChance + critChanceBonus,
            critDamage: state.character.stats.critDamage + critDamageBonus,
            dodge: state.character.stats.dodge + dodgeBonus,
            lifeSteal: state.character.stats.lifeSteal + lifeStealBonus,
            goldFind: state.character.stats.goldFind + goldFindBonus,
            expBonus: state.character.stats.expBonus + expBonusBonus,
          },
          equippedItems: {
            ...state.character.equippedItems,
            [action.slot]: null,
          },
          inventory: [...state.character.inventory, currentItem],
        },
      };
    }

    case 'DROP_ITEM':
      if (!state.character) return state;
      return {
        ...state,
        character: {
          ...state.character,
          inventory: state.character.inventory.filter(i => i.id !== action.itemId),
        },
      };

    case 'BUY_ITEM':
      if (!state.character || state.character.stats.gold < action.item.value) return state;
      const boughtItem: LootItem = {
        id: `${action.item.id}-${Date.now()}`,
        name: action.item.name,
        baseName: action.item.name,
        slot: action.item.type === 'weapon' ? 'weapon' : action.item.type === 'armor' ? 'chest' : 'consumable',
        rarity: 'normal',
        level: 1,
        requiredLevel: action.item.type === 'potion' ? 0 : 1,
        mods: [{
          type: action.item.type === 'weapon' ? 'attack' : action.item.type === 'armor' ? 'defense' : 'health',
          value: action.item.effect,
          description: action.item.description,
        }],
        value: action.item.value,
        icon: action.item.type === 'weapon' ? '⚔️' : action.item.type === 'armor' ? '🛡️' : '🧪',
      };
      return {
        ...state,
        character: {
          ...state.character,
          stats: {
            ...state.character.stats,
            gold: state.character.stats.gold - action.item.value,
          },
          inventory: [...state.character.inventory, boughtItem],
        },
      };

    case 'NEXT_ROOM': {
      const currentPathId = state.currentPathId;
      const currentRoomId = state.currentRoom?.id || '';
      
      // Check if this path already leads to a known room
      if (currentPathId && state.pathToRoom[currentPathId]) {
        const existingRoomId = state.pathToRoom[currentPathId];
        const existingRoom = state.discoveredRooms.find(r => r.id === existingRoomId);
        
        if (existingRoom) {
          // Return to the existing room without incrementing counters
          return {
            ...state,
            screen: 'dungeon',
            currentRoom: { ...existingRoom },
            currentEncounter: null,
            currentPathId: null,
            combat: null,
          };
        }
      }
      
      // Try to get the next room from the monastery dungeon layout
      const monasteryNextRoom = currentPathId 
        ? getNextMonasteryRoom(currentRoomId, currentPathId)
        : null;
      
      // Check if we reached the boss room (final room)
      if (monasteryNextRoom && isMonasteryBossRoom(monasteryNextRoom.id)) {
        // Boss room - trigger victory after clearing it
        const newRoomsCleared = state.roomsCleared + 1;
        return {
          ...state,
          screen: 'dungeon',
          roomsCleared: newRoomsCleared,
          dungeonFloor: monasteryNextRoom.floor,
          currentRoom: monasteryNextRoom,
          currentEncounter: null,
          currentPathId: null,
          combat: null,
          pathToRoom: currentPathId 
            ? { ...state.pathToRoom, [currentPathId]: monasteryNextRoom.id }
            : state.pathToRoom,
        };
      }
      
      // Use monastery room if available, otherwise fall back to random generation
      const newRoomsCleared = state.roomsCleared + 1;
      const newFloor = monasteryNextRoom?.floor || (newRoomsCleared % 5 === 0 ? state.dungeonFloor + 1 : state.dungeonFloor);
      const newRoom = monasteryNextRoom || generateRoom(newFloor);
      
      // Map this path to the new room
      const updatedPathToRoom = currentPathId 
        ? { ...state.pathToRoom, [currentPathId]: newRoom.id }
        : state.pathToRoom;
      
      return {
        ...state,
        screen: 'dungeon',
        roomsCleared: newRoomsCleared,
        dungeonFloor: newFloor,
        currentRoom: newRoom,
        currentEncounter: null,
        currentPathId: null,
        combat: null,
        pathToRoom: updatedPathToRoom,
      };
    }

    case 'MARK_PATH_CLEARED': {
      if (state.clearedPathIds.includes(action.pathId)) return state;
      return {
        ...state,
        clearedPathIds: [...state.clearedPathIds, action.pathId],
      };
    }

    case 'BACKTRACK_TO_ROOM': {
      const targetRoom = state.discoveredRooms.find(r => r.id === action.roomId);
      if (!targetRoom) return state;
      
      return {
        ...state,
        screen: 'dungeon',
        currentRoom: { ...targetRoom },
        currentEncounter: null,
        currentPathId: null,
        combat: null,
      };
    }

    case 'SPEND_ATTRIBUTE_POINT': {
      if (!state.character || state.character.attributePoints <= 0) return state;
      
      const newAttributes = {
        ...state.character.attributes,
        [action.attribute]: state.character.attributes[action.attribute] + 1,
      };
      
      // Recalculate derived stats
      const newDerivedStats = calculateDerivedStats(newAttributes, state.character.stats.level);
      
      return {
        ...state,
        character: {
          ...state.character,
          attributes: newAttributes,
          attributePoints: state.character.attributePoints - 1,
          stats: {
            ...state.character.stats,
            ...newDerivedStats,
            // Keep current resource values (don't reset health/mana)
            health: Math.min(state.character.stats.health, newDerivedStats.maxHealth),
            mana: Math.min(state.character.stats.mana, newDerivedStats.maxMana),
          },
        },
      };
    }

    case 'LEARN_SKILL': {
      if (!state.character || state.character.skillPoints <= 0) return state;
      
      const skill = getSkillById(action.skillId, state.character.class);
      if (!skill) return state;
      
      const { canLearn } = canLearnSkill(skill, state.character.stats.level, state.character.skills);
      if (!canLearn) return state;
      
      // Check if already learned (upgrade rank) or new skill
      const existingSkillIndex = state.character.skills.findIndex(s => s.skillId === action.skillId);
      let newSkills: LearnedSkill[];
      
      if (existingSkillIndex >= 0) {
        // Upgrade existing skill
        const existingSkill = state.character.skills[existingSkillIndex];
        if (existingSkill.rank >= skill.maxRank) return state;
        
        newSkills = [...state.character.skills];
        newSkills[existingSkillIndex] = {
          ...existingSkill,
          rank: existingSkill.rank + 1,
        };
      } else {
        // Learn new skill
        newSkills = [
          ...state.character.skills,
          { skillId: action.skillId, rank: 1, currentCooldown: 0 },
        ];
      }
      
      // Apply passive bonuses if it's a passive skill
      let newStats = { ...state.character.stats };
      if (skill.type === 'passive' && skill.passiveBonus) {
        for (const bonus of skill.passiveBonus) {
          const statKey = bonus.stat as keyof typeof newStats;
          if (typeof newStats[statKey] === 'number') {
            (newStats[statKey] as number) += bonus.value;
          }
        }
      }
      
      return {
        ...state,
        character: {
          ...state.character,
          skillPoints: state.character.skillPoints - 1,
          skills: newSkills,
          stats: newStats,
        },
      };
    }

    case 'USE_SKILL': {
      if (!state.combat || !state.character) return state;
      
      const skill = getSkillById(action.skillId, state.character.class);
      if (!skill || skill.type !== 'active') return state;
      
      const learnedSkill = state.character.skills.find(s => s.skillId === action.skillId);
      if (!learnedSkill) return state;
      
      // Check cooldown
      if (learnedSkill.currentCooldown > 0) return state;
      
      // Check mana
      if (state.character.stats.mana < skill.manaCost) return state;
      
      const { enemy } = state.combat;
      let newCombat = { ...state.combat };
      let newCharacter = { ...state.character };
      let newLog = [...state.combat.combatLog];
      
      // Deduct mana
      newCharacter = {
        ...newCharacter,
        stats: {
          ...newCharacter.stats,
          mana: newCharacter.stats.mana - skill.manaCost,
        },
      };
      
      // Set cooldown
      const newSkills = newCharacter.skills.map(s => 
        s.skillId === action.skillId 
          ? { ...s, currentCooldown: skill.cooldown || 0 }
          : s
      );
      newCharacter = { ...newCharacter, skills: newSkills };
      
      // Apply skill effects
      let totalDamage = 0;
      let totalHeal = 0;
      
      for (const effect of skill.effects) {
        const effectValue = calculateSkillEffectValue(
          effect,
          learnedSkill.rank,
          skill.rankBonuses,
          {
            attack: newCharacter.stats.attack,
            magicAttack: newCharacter.stats.magicAttack,
            maxHealth: newCharacter.stats.maxHealth,
            maxMana: newCharacter.stats.maxMana,
            intelligence: newCharacter.attributes.intelligence,
            strength: newCharacter.attributes.strength,
            dexterity: newCharacter.attributes.dexterity,
          }
        );
        
        switch (effect.type) {
          case 'damage':
          case 'magic_damage': {
            const defense = effect.type === 'magic_damage' ? enemy.magicDefense || 0 : enemy.defense;
            const damage = Math.max(1, effectValue - Math.floor(defense / 2));
            totalDamage += damage;
            break;
          }
          case 'heal': {
            totalHeal += effectValue;
            break;
          }
          case 'heal_percent': {
            totalHeal += Math.floor(newCharacter.stats.maxHealth * (effectValue / 100));
            break;
          }
          case 'buff_attack':
          case 'buff_defense':
          case 'buff_crit': {
            const newBuff: ActiveBuff = {
              skillId: skill.id,
              effectType: effect.type,
              value: effectValue,
              remainingTurns: effect.duration || 5, // Duration in seconds now
            };
            newCombat = {
              ...newCombat,
              activeBuffs: [...newCombat.activeBuffs, newBuff],
            };
            newLog.push(`${skill.name} activated! +${effectValue}% ${effect.type.replace('buff_', '')} for ${effect.duration || 5}s.`);
            break;
          }
          case 'debuff_defense': {
            const newDebuff: ActiveBuff = {
              skillId: skill.id,
              effectType: effect.type,
              value: effectValue,
              remainingTurns: effect.duration || 5, // Duration in seconds now
              isDebuff: true,
            };
            newCombat = {
              ...newCombat,
              enemyDebuffs: [...newCombat.enemyDebuffs, newDebuff],
            };
            newLog.push(`${enemy.name}'s defense reduced by ${effectValue} for ${effect.duration || 5}s!`);
            break;
          }
          case 'stun': {
            // Stun skips enemy turn - handled after this
            newLog.push(`${enemy.name} is stunned!`);
            break;
          }
          case 'bleed': {
            const bleedDebuff: ActiveBuff = {
              skillId: skill.id,
              effectType: 'bleed',
              value: effectValue,
              remainingTurns: effect.duration || 5, // Duration in seconds now
              isDebuff: true,
            };
            newCombat = {
              ...newCombat,
              enemyDebuffs: [...newCombat.enemyDebuffs, bleedDebuff],
            };
            newLog.push(`${enemy.name} is bleeding for ${effectValue} damage per second!`);
            break;
          }
          case 'lifesteal_attack': {
            const damage = Math.max(1, effectValue - Math.floor(enemy.defense / 2));
            totalDamage += damage;
            const healAmount = Math.floor(damage * 0.5);
            totalHeal += healAmount;
            break;
          }
          case 'shield': {
            newCombat = {
              ...newCombat,
              shieldAmount: newCombat.shieldAmount + effectValue,
            };
            newLog.push(`Shield absorbs up to ${effectValue} damage!`);
            break;
          }
          case 'mana_restore': {
            newCharacter = {
              ...newCharacter,
              stats: {
                ...newCharacter.stats,
                mana: Math.min(newCharacter.stats.maxMana, newCharacter.stats.mana + effectValue),
              },
            };
            newLog.push(`Restored ${effectValue} mana!`);
            break;
          }
        }
      }
      
      // Apply total damage to enemy
      if (totalDamage > 0) {
        newCombat.enemy = { ...enemy, health: enemy.health - totalDamage };
        newLog.push(`${skill.name} deals ${totalDamage} damage!`);
      }
      
      // Apply total healing
      if (totalHeal > 0) {
        const actualHeal = Math.min(totalHeal, newCharacter.stats.maxHealth - newCharacter.stats.health);
        newCharacter = {
          ...newCharacter,
          stats: {
            ...newCharacter.stats,
            health: newCharacter.stats.health + actualHeal,
          },
        };
        if (actualHeal > 0) {
          newLog.push(`Healed for ${actualHeal} HP!`);
        }
      }
      
      // Check if enemy defeated
      if (newCombat.enemy.health <= 0) {
        const expGain = Math.floor(enemy.expReward * (1 + newCharacter.stats.expBonus / 100));
        const goldGain = Math.floor(enemy.goldReward * (1 + newCharacter.stats.goldFind / 100));
        newCharacter = {
          ...newCharacter,
          stats: {
            ...newCharacter.stats,
            gold: newCharacter.stats.gold + goldGain,
            experience: newCharacter.stats.experience + expGain,
          },
        };
        newCharacter = checkLevelUp(newCharacter);
        newLog.push(`Victory! +${goldGain} gold, +${expGain} exp`);
        
        return {
          ...state,
          character: newCharacter,
          combat: { ...newCombat, combatLog: newLog },
          screen: 'victory',
        };
      }
      
      // Stun effect pauses enemy action bar briefly
      const hasStun = skill.effects.some(e => e.type === 'stun');
      if (hasStun) {
        // Reset enemy action bar on stun
        newCombat = { ...newCombat, enemyActionBar: 0 };
      }
      
      // Semi-idle: skills don't trigger enemy turns - just return the new state
      return {
        ...state,
        character: newCharacter,
        combat: { ...newCombat, combatLog: newLog },
      };
    }

    case 'RESET_GAME':
      localStorage.removeItem(STORAGE_KEY);
      return initialState;

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  saveGame: () => void;
  hasSavedGame: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const hasSavedGame = typeof window !== 'undefined' && !!localStorage.getItem(STORAGE_KEY);

  // Save game state to localStorage and database
  useEffect(() => {
    if (state.character && state.screen !== 'menu' && state.screen !== 'game-over') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      // Also save to database
      const characterId = localStorage.getItem(CHARACTER_ID_KEY);
      if (characterId) {
        supabase
          .from('characters')
          .update({ game_state: JSON.parse(JSON.stringify(state)) })
          .eq('id', characterId)
          .then(({ error }) => {
            if (error && import.meta.env.DEV) console.error('Database save failed:', error.message);
          });
      }
    }
  }, [state]);

  const saveGame = () => {
    if (state.character) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  };

  return (
    <GameContext.Provider value={{ state, dispatch, saveGame, hasSavedGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export function loadSavedGame(): GameState | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveCharacterToDatabase(name: string, characterClass: CharacterClass, gameState: GameState): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('characters')
    .insert([{
      user_id: user.id,
      name,
      class: characterClass,
      game_state: JSON.parse(JSON.stringify(gameState)),
    }])
    .select('id')
    .single();

  if (error) {
    if (import.meta.env.DEV) console.error('Character save failed:', error.message);
    return null;
  }

  localStorage.setItem(CHARACTER_ID_KEY, data.id);
  return data.id;
}

export function setCurrentCharacterId(id: string) {
  localStorage.setItem(CHARACTER_ID_KEY, id);
}
