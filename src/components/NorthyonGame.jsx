import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls, Sky, Stars } from '@react-three/drei'
import * as THREE from 'three'

const SAVE_KEY = 'northyon.realms.save.v1'

const races = {
  humano: {
    name: 'Humano',
    className: 'Guardião do Sol',
    archetype: 'GUERREIRO',
    city: 'Cidade da Aurora',
    region: 'Campos da Aurora',
    description: 'Versátil e indomável. Aço, disciplina e uma vontade que não cede.',
    accent: '#f3bd72',
    skin: '#e9b99a',
    hair: '#392321',
    armor: '#a85238',
    weapon: 'Lâmina solar',
    base: { hp: 145, mp: 78, str: 12, dex: 7, int: 5, vit: 11 },
  },
  alado: {
    name: 'Alado',
    className: 'Vigia do Firmamento',
    archetype: 'ARQUEIRO',
    city: 'Santuário Celeste',
    region: 'Terraços Celestes',
    description: 'Olhos que alcançam o horizonte. Aether e vento guiam cada flecha.',
    accent: '#9ee5e8',
    skin: '#ecc6b4',
    hair: '#d9c69c',
    armor: '#397d85',
    weapon: 'Arco de aurora',
    base: { hp: 112, mp: 104, str: 6, dex: 13, int: 8, vit: 7 },
  },
  selvagem: {
    name: 'Selvagem',
    className: 'Fúria Ancestral',
    archetype: 'BÁRBARO',
    city: 'Refúgio Primordial',
    region: 'Bosque Primordial',
    description: 'A força de uma linhagem antiga e o coração que protege a floresta.',
    accent: '#b7d38a',
    skin: '#bd8969',
    hair: '#28231d',
    armor: '#617542',
    weapon: 'Machado rúnico',
    base: { hp: 172, mp: 64, str: 14, dex: 5, int: 4, vit: 14 },
  },
}

const species = [
  { id: 'wolf', name: 'Lobo de Bruma', level: 1, hp: 58, position: [8, 0, -8], color: '#b7a7a0', reward: 34 },
  { id: 'moth', name: 'Mariposa Rubra', level: 2, hp: 66, position: [-10, 0, -8], color: '#ad6580', reward: 40 },
  { id: 'wraith', name: 'Eco Desperto', level: 2, hp: 78, position: [11, 0, 2], color: '#7c9bc4', reward: 46 },
  { id: 'sentinel', name: 'Sentinela Fraturado', level: 3, hp: 100, position: [-13, 0, 4], color: '#ae8461', reward: 58 },
  { id: 'bear', name: 'Urso da Névoa', level: 2, hp: 92, position: [5, 0, 12], color: '#8e654e', reward: 52 },
  { id: 'elemental', name: 'Núcleo Errante', level: 3, hp: 86, position: [-5, 0, 14], color: '#68bed0', reward: 60 },
]

const skills = [
  { key: '1', id: 'strike', label: 'Ataque', icon: '⚔', cost: 0, range: 3.8, damage: 25 },
  { key: '2', id: 'aether', label: 'Aether', icon: '✦', cost: 14, range: 12, damage: 42 },
  { key: '3', id: 'potion', label: 'Poção', icon: '✚', cost: 0, range: 0, damage: 0 },
  { key: '4', id: 'burst', label: 'Ruptura', icon: '❖', cost: 22, range: 7, damage: 58 },
]

const initialQuest = {
  status: 'available',
  kills: 0,
  title: 'Ecos na fronteira',
}

function makeCharacter(nickname, raceId) {
  const race = races[raceId]
  return {
    nickname: nickname.trim(),
    race: raceId,
    level: 1,
    xp: 0,
    xpToNext: 100,
    freeAttributePoints: 0,
    hp: race.base.hp,
    maxHp: race.base.hp,
    mp: race.base.mp,
    maxMp: race.base.mp,
    ...race.base,
  }
}

function readSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.playerData?.nickname || !races[parsed.playerData.race]) return null
    return parsed
  } catch (error) {
    console.error('Não foi possível ler o salvamento local de NORTHYON.', error)
    return null
  }
}

function CharacterModel({ raceId, preview = false }) {
  const race = races[raceId]
  const group = useRef()
  const leftLeg = useRef()
  const rightLeg = useRef()
  const leftArm = useRef()
  const rightArm = useRef()

  useFrame(({ clock }, delta) => {
    if (!group.current) return
    const time = clock.elapsedTime
    group.current.rotation.y = preview ? Math.sin(time * 0.35) * 0.28 : group.current.rotation.y
    group.current.position.y = preview ? Math.sin(time * 1.4) * 0.045 : 0
    const gait = Math.sin(time * 9) * 0.06
    if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.damp(leftLeg.current.rotation.x, gait, 8, delta)
    if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.damp(rightLeg.current.rotation.x, -gait, 8, delta)
    if (leftArm.current) leftArm.current.rotation.x = THREE.MathUtils.damp(leftArm.current.rotation.x, -gait * 0.55, 8, delta)
    if (rightArm.current) rightArm.current.rotation.x = THREE.MathUtils.damp(rightArm.current.rotation.x, gait * 0.55, 8, delta)
  })

  return (
    <group ref={group} scale={preview ? 1.12 : 1}>
      <mesh castShadow position={[0, 1.4, 0]}>
        <capsuleGeometry args={[0.3, 0.5, 6, 14]} />
        <meshStandardMaterial color={race.armor} roughness={0.42} metalness={0.42} />
      </mesh>
      <mesh castShadow position={[0, 1.71, 0.01]} scale={[1.02, 0.84, 0.78]}>
        <sphereGeometry args={[0.34, 24, 18]} />
        <meshStandardMaterial color={race.armor} roughness={0.36} metalness={0.46} />
      </mesh>
      <mesh castShadow position={[0, 1.68, 0.2]} scale={[1.28, 1.08, 0.72]}>
        <sphereGeometry args={[0.31, 20, 16]} />
        <meshStandardMaterial color={race.armor} roughness={0.3} metalness={0.55} />
      </mesh>
      <mesh position={[0, 1.61, 0.42]} rotation={[0.16, 0, 0]}>
        <torusGeometry args={[0.18, 0.027, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#e8c981" roughness={0.27} metalness={0.74} />
      </mesh>
      <mesh castShadow position={[0, 2.12, 0]}>
        <sphereGeometry args={[0.255, 24, 20]} />
        <meshStandardMaterial color={race.skin} roughness={0.68} />
      </mesh>
      <mesh castShadow position={[0, 2.29, -0.018]} scale={[1.08, 0.5, 0.97]}>
        <sphereGeometry args={[0.25, 20, 14]} />
        <meshStandardMaterial color={race.hair} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 2.015, 0.22]} scale={[0.38, 0.19, 0.25]}>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshStandardMaterial color={race.skin} roughness={0.68} />
      </mesh>
      <mesh position={[0, 1.19, 0]}>
        <cylinderGeometry args={[0.28, 0.31, 0.16, 10]} />
        <meshStandardMaterial color="#302b32" metalness={0.55} roughness={0.38} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.087, 2.15, 0.272]}>
            <sphereGeometry args={[0.022, 10, 8]} />
            <meshBasicMaterial color={raceId === 'selvagem' ? '#c5e98c' : '#3c2b28'} />
          </mesh>
          <mesh castShadow position={[side * 0.44, 1.68, 0]}>
            <sphereGeometry args={[0.2, 14, 12]} />
            <meshStandardMaterial color={race.accent} metalness={0.56} roughness={0.34} />
          </mesh>
          <mesh position={[side * 0.44, 1.68, 0.14]}>
            <sphereGeometry args={[0.075, 10, 8]} />
            <meshStandardMaterial color="#d8bd81" metalness={0.72} roughness={0.27} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.72, 0.39]}>
        <octahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial color="#f4d994" emissive="#e0b967" emissiveIntensity={0.22} metalness={0.42} roughness={0.25} />
      </mesh>

      <group ref={leftArm} position={[-0.42, 1.55, 0]}>
        <mesh castShadow position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.12, 0.32, 4, 8]} />
          <meshStandardMaterial color={race.armor} metalness={0.3} roughness={0.42} />
        </mesh>
        <mesh castShadow position={[0, -0.49, 0.02]}>
          <sphereGeometry args={[0.12, 12, 10]} />
          <meshStandardMaterial color={race.skin} roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.17, 12, 10]} />
          <meshStandardMaterial color={race.accent} metalness={0.55} roughness={0.34} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.42, 1.55, 0]}>
        <mesh castShadow position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.12, 0.32, 4, 8]} />
          <meshStandardMaterial color={race.armor} metalness={0.3} roughness={0.42} />
        </mesh>
        <mesh castShadow position={[0, -0.49, 0.02]}>
          <sphereGeometry args={[0.12, 12, 10]} />
          <meshStandardMaterial color={race.skin} roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.17, 12, 10]} />
          <meshStandardMaterial color={race.accent} metalness={0.55} roughness={0.34} />
        </mesh>
      </group>
      <group ref={leftLeg} position={[-0.18, 0.92, 0]}>
        <mesh castShadow position={[0, -0.28, 0]}>
          <capsuleGeometry args={[0.14, 0.4, 4, 8]} />
          <meshStandardMaterial color="#34313a" roughness={0.62} />
        </mesh>
        <mesh castShadow position={[0, -0.55, 0.07]} scale={[1, 0.7, 1.4]}>
          <sphereGeometry args={[0.16, 12, 10]} />
          <meshStandardMaterial color={race.accent} metalness={0.4} roughness={0.38} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.18, 0.92, 0]}>
        <mesh castShadow position={[0, -0.28, 0]}>
          <capsuleGeometry args={[0.14, 0.4, 4, 8]} />
          <meshStandardMaterial color="#34313a" roughness={0.62} />
        </mesh>
        <mesh castShadow position={[0, -0.55, 0.07]} scale={[1, 0.7, 1.4]}>
          <sphereGeometry args={[0.16, 12, 10]} />
          <meshStandardMaterial color={race.accent} metalness={0.4} roughness={0.38} />
        </mesh>
      </group>

      {raceId === 'alado' && (
        <group position={[0, 1.56, -0.25]}>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.22, 0.08, 0]} rotation={[0.08, side * -0.14, side * 0.12]}>
              <mesh castShadow position={[side * 0.38, 0.32, -0.02]} rotation={[0, 0, side * -0.3]}>
                <capsuleGeometry args={[0.16, 0.72, 5, 10]} />
                <meshStandardMaterial color="#eff8f5" roughness={0.6} emissive="#86d9de" emissiveIntensity={0.1} />
              </mesh>
              {[-1, 0, 1].map((feather) => (
                <mesh key={feather} castShadow position={[side * (0.48 + Math.abs(feather) * 0.12), 0.06 - Math.abs(feather) * 0.15, 0.02]} rotation={[0, 0, side * -0.55]}>
                  <capsuleGeometry args={[0.065, 0.38, 4, 8]} />
                  <meshStandardMaterial color={feather === 0 ? '#f9e8bd' : '#d7f3ef'} roughness={0.65} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}
      {raceId === 'selvagem' && (
        <>
          {[-1, 1].map((side) => (
            <mesh key={side} castShadow position={[side * 0.18, 2.25, 0]} rotation={[0, 0, side * -0.25]}>
              <coneGeometry args={[0.09, 0.25, 8]} />
              <meshStandardMaterial color="#e2c995" roughness={0.52} />
            </mesh>
          ))}
          <mesh castShadow position={[0, 2.06, 0.22]} scale={[0.75, 0.36, 0.42]}>
            <sphereGeometry args={[0.18, 14, 10]} />
            <meshStandardMaterial color="#805c49" roughness={0.7} />
          </mesh>
        </>
      )}

      {raceId === 'alado' ? (
        <group position={[0.57, 1.42, 0.06]} rotation={[0.08, 0.08, -0.16]}>
          <mesh castShadow>
            <torusGeometry args={[0.47, 0.035, 8, 28, Math.PI]} />
            <meshStandardMaterial color="#cfb580" metalness={0.72} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.009, 0.009, 0.92, 6]} />
            <meshStandardMaterial color="#e8dfc5" roughness={0.42} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <sphereGeometry args={[0.055, 10, 8]} />
            <meshStandardMaterial color="#8edfe1" emissive="#67cdd0" emissiveIntensity={0.7} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <sphereGeometry args={[0.075, 10, 8]} />
            <meshStandardMaterial color="#dfbd79" metalness={0.65} roughness={0.3} />
          </mesh>
        </group>
      ) : raceId === 'selvagem' ? (
        <group position={[0.59, 1.34, 0.02]} rotation={[0.08, 0, -0.12]}>
          <mesh castShadow position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.035, 0.06, 0.98, 8]} />
            <meshStandardMaterial color="#624737" roughness={0.68} />
          </mesh>
          <mesh castShadow position={[0, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
            <dodecahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial color="#aab5a0" metalness={0.7} roughness={0.27} />
          </mesh>
          <mesh castShadow position={[0.23, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.12, 0.29, 5]} />
            <meshStandardMaterial color="#d2bb86" metalness={0.5} roughness={0.34} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <torusGeometry args={[0.1, 0.025, 8, 12]} />
            <meshStandardMaterial color="#b9a16d" metalness={0.6} roughness={0.32} />
          </mesh>
        </group>
      ) : (
        <group position={[0.6, 1.25, 0.02]} rotation={[0.08, 0, -0.12]}>
          <mesh castShadow position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.018, 0.025, 0.94, 8]} />
            <meshStandardMaterial color="#c6a46a" metalness={0.8} roughness={0.24} />
          </mesh>
          <mesh castShadow position={[0, 0.92, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.1, 0.42, 6]} />
            <meshStandardMaterial color={race.accent} metalness={0.74} roughness={0.23} emissive={race.accent} emissiveIntensity={0.15} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <torusGeometry args={[0.09, 0.016, 8, 16]} />
            <meshStandardMaterial color="#f1d89f" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      )}
      {preview && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.86, 1.02, 48]} />
          <meshBasicMaterial color={race.accent} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  )
}

function PlayerController({ raceId, position, queuedSkill, targetPosition, targetRange, locked, onMove, onAttackReady }) {
  const root = useRef()
  const keys = useRef({})
  const verticalVelocity = useRef(0)
  const lastReport = useRef(0)
  const firedSkill = useRef(null)

  useEffect(() => {
    const down = (event) => {
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright', ' '].includes(event.key.toLowerCase())) {
        keys.current[event.key.toLowerCase()] = true
        if (event.key === ' ') event.preventDefault()
      }
    }
    const up = (event) => { keys.current[event.key.toLowerCase()] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useEffect(() => {
    if (!queuedSkill) firedSkill.current = null
  }, [queuedSkill])

  useFrame(({ camera, clock }, delta) => {
    if (!root.current) return
    if (locked) return
    const object = root.current
    const current = object.position
    const target = targetPosition ? new THREE.Vector3(...targetPosition) : null
    const toTarget = target ? new THREE.Vector3(target.x - current.x, 0, target.z - current.z) : null
    const distance = toTarget?.length() ?? Infinity

    if (queuedSkill && target && distance <= targetRange && firedSkill.current !== queuedSkill) {
      firedSkill.current = queuedSkill
      onAttackReady(queuedSkill)
    }

    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3(forward.z, 0, -forward.x)
    const direction = new THREE.Vector3()
    const input = keys.current
    if (input.w || input.arrowup) direction.add(forward)
    if (input.s || input.arrowdown) direction.sub(forward)
    if (input.d || input.arrowright) direction.add(right)
    if (input.a || input.arrowleft) direction.sub(right)
    if (queuedSkill && toTarget && distance > targetRange) direction.add(toTarget.normalize())
    if (direction.lengthSq() > 0) {
      direction.normalize()
      const speed = input.shift ? 8.2 : 5.3
      current.x += direction.x * speed * delta
      current.z += direction.z * speed * delta
      object.rotation.y = THREE.MathUtils.damp(object.rotation.y, Math.atan2(direction.x, direction.z), 10, delta)
    } else if (queuedSkill && toTarget) {
      object.rotation.y = THREE.MathUtils.damp(object.rotation.y, Math.atan2(toTarget.x, toTarget.z), 10, delta)
    }

    if (input[' '] && current.y <= 0.02) verticalVelocity.current = 5.2
    verticalVelocity.current -= 12 * delta
    current.y = Math.max(0, current.y + verticalVelocity.current * delta)
    if (current.y === 0) verticalVelocity.current = 0

    if (clock.elapsedTime - lastReport.current > 0.12) {
      lastReport.current = clock.elapsedTime
      onMove([current.x, 0, current.z], object.rotation.y)
    }
  })

  return (
    <group ref={root} position={position}>
      <CharacterModel raceId={raceId} />
    </group>
  )
}

function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.12, 0.22, 2.4, 7]} />
        <meshStandardMaterial color="#514538" roughness={0.9} />
      </mesh>
      {[0, 1, 2].map((layer) => (
        <mesh key={layer} castShadow position={[0, 2 + layer * 0.62, 0]} scale={[1 - layer * 0.17, 1.1, 1 - layer * 0.17]}>
          <coneGeometry args={[1.05, 2, 8]} />
          <meshStandardMaterial color={layer === 1 ? '#416249' : '#315744'} roughness={0.88} />
        </mesh>
      ))}
      <mesh position={[0.36, 2.15, 0.34]}>
        <sphereGeometry args={[0.075, 8, 8]} />
        <meshBasicMaterial color="#9be0c3" />
      </mesh>
    </group>
  )
}

function Ruin({ position, height = 3 }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.55, 0.68, height, 8]} />
        <meshStandardMaterial color="#756c64" roughness={0.86} />
      </mesh>
      <mesh castShadow position={[0, height + 0.08, 0]}>
        <cylinderGeometry args={[0.73, 0.73, 0.24, 8]} />
        <meshStandardMaterial color="#94816c" roughness={0.78} />
      </mesh>
      <mesh position={[0, height * 0.62, 0.57]}>
        <boxGeometry args={[0.13, 0.8, 0.035]} />
        <meshBasicMaterial color="#b28b57" />
      </mesh>
    </group>
  )
}

function Crystal({ position, color = '#65d9d0', scale = 1 }) {
  const crystal = useRef()
  useFrame(({ clock }) => {
    if (crystal.current) {
      crystal.current.rotation.y = clock.elapsedTime * 0.28
      crystal.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.4 + position[0]) * 0.09
    }
  })
  return (
    <group ref={crystal} position={position} scale={scale}>
      <mesh castShadow>
        <octahedronGeometry args={[0.62, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} roughness={0.18} metalness={0.12} />
      </mesh>
      <pointLight color={color} intensity={0.85} distance={5} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
        <torusGeometry args={[0.72, 0.024, 8, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.58} />
      </mesh>
    </group>
  )
}

function MonsterModel({ monster }) {
  const body = useRef()
  const color = monster.color
  useFrame(({ clock }) => {
    if (body.current) body.current.position.y = 0.88 + Math.sin(clock.elapsedTime * 2 + monster.position[0]) * 0.045
  })
  return (
    <group>
      {monster.id === 'wolf' && (
        <>
          <mesh castShadow ref={body} position={[0, 0.88, 0]} scale={[0.74, 0.52, 1.08]}>
            <sphereGeometry args={[0.62, 18, 14]} />
            <meshStandardMaterial color={color} roughness={0.68} />
          </mesh>
          <mesh castShadow position={[0, 1.04, 0.73]} rotation={[0.25, 0, 0]}>
            <coneGeometry args={[0.27, 0.55, 8]} />
            <meshStandardMaterial color={color} roughness={0.68} />
          </mesh>
          {[-1, 1].map((side) => <mesh key={side} castShadow position={[side * 0.17, 1.54, 0.68]} rotation={[0, 0, side * -0.25]}><coneGeometry args={[0.11, 0.38, 6]} /><meshStandardMaterial color="#9b7770" /></mesh>)}
        </>
      )}
      {monster.id === 'moth' && (
        <>
          <mesh ref={body} position={[0, 0.9, 0]}><capsuleGeometry args={[0.3, 0.48, 5, 10]} /><meshStandardMaterial color={color} roughness={0.43} emissive="#361627" emissiveIntensity={0.3} /></mesh>
          {[-1, 1].map((side) => <mesh key={side} castShadow position={[side * 0.65, 1.18, -0.06]} rotation={[0.08, side * -0.1, side * 0.32]} scale={[0.92, 0.53, 0.08]}><sphereGeometry args={[0.78, 16, 10]} /><meshStandardMaterial color={side === 1 ? '#ce8b92' : '#755574'} roughness={0.58} side={THREE.DoubleSide} /></mesh>)}
        </>
      )}
      {monster.id === 'wraith' && (
        <>
          <mesh ref={body} position={[0, 0.95, 0]}><coneGeometry args={[0.62, 1.55, 7]} /><meshStandardMaterial color={color} transparent opacity={0.84} emissive="#375a9c" emissiveIntensity={0.38} roughness={0.24} /></mesh>
          <mesh position={[0, 1.72, 0]}><sphereGeometry args={[0.33, 16, 14]} /><meshStandardMaterial color="#c5e8f1" emissive="#6cbbdd" emissiveIntensity={0.8} /></mesh>
        </>
      )}
      {monster.id === 'sentinel' && (
        <>
          <mesh castShadow ref={body} position={[0, 0.96, 0]}><dodecahedronGeometry args={[0.68, 0]} /><meshStandardMaterial color={color} roughness={0.8} metalness={0.24} /></mesh>
          <mesh position={[0, 1.63, 0]}><boxGeometry args={[0.72, 0.44, 0.54]} /><meshStandardMaterial color="#75695e" roughness={0.82} /></mesh>
          <mesh position={[0, 1.67, 0.29]}><boxGeometry args={[0.32, 0.06, 0.04]} /><meshBasicMaterial color="#e7a866" /></mesh>
          {[-1, 1].map((side) => <mesh key={side} castShadow position={[side * 0.7, 1.25, 0]}><sphereGeometry args={[0.27, 10, 8]} /><meshStandardMaterial color="#796d61" roughness={0.88} /></mesh>)}
        </>
      )}
      {monster.id === 'bear' && (
        <>
          <mesh castShadow ref={body} position={[0, 0.92, 0]} scale={[0.82, 0.76, 0.74]}><sphereGeometry args={[0.7, 18, 14]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
          <mesh castShadow position={[0, 1.48, 0.29]}><sphereGeometry args={[0.4, 16, 12]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
          {[-1, 1].map((side) => <mesh key={side} castShadow position={[side * 0.3, 1.76, 0.27]}><sphereGeometry args={[0.13, 10, 8]} /><meshStandardMaterial color="#dbbda0" /></mesh>)}
        </>
      )}
      {monster.id === 'elemental' && (
        <>
          <mesh ref={body} position={[0, 0.96, 0]}><octahedronGeometry args={[0.67, 1]} /><meshStandardMaterial color={color} emissive="#197e9b" emissiveIntensity={0.9} roughness={0.18} metalness={0.22} /></mesh>
          <mesh position={[0, 1.8, 0]}><octahedronGeometry args={[0.24, 0]} /><meshStandardMaterial color="#e1ffff" emissive="#8cf4ff" emissiveIntensity={1.8} /></mesh>
          {[0, 1, 2].map((i) => <mesh key={i} position={[Math.sin(i * 2.1) * 0.76, 1 + Math.cos(i * 2.1) * 0.5, 0]}><octahedronGeometry args={[0.18, 0]} /><meshStandardMaterial color="#9df4ee" emissive="#3dcddd" emissiveIntensity={0.8} /></mesh>)}
        </>
      )}
    </group>
  )
}

function Monster({ monster, selected, onSelect }) {
  if (monster.hp <= 0) return null
  return (
    <group position={monster.position} onClick={(event) => { event.stopPropagation(); onSelect(monster) }}>
      {selected && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.72, 0.86, 32]} />
          <meshBasicMaterial color="#ff8069" transparent opacity={0.86} />
        </mesh>
      )}
      <MonsterModel monster={monster} />
      <Html position={[0, 2.05, 0]} center distanceFactor={13} style={{ pointerEvents: 'none' }}>
        <div className={`creatureNameplate ${selected ? 'selected' : ''}`}>
          <span>{monster.name}</span>
          <div className="creatureHealth"><i style={{ width: `${(monster.hp / monster.maxHp) * 100}%` }} /></div>
        </div>
      </Html>
      <mesh position={[0, 0.8, 0]} onClick={(event) => { event.stopPropagation(); onSelect(monster) }}>
        <sphereGeometry args={[1.15, 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Guide({ onSelect }) {
  return (
    <group position={[-3.7, 0, -5.6]} onClick={(event) => { event.stopPropagation(); onSelect() }}>
      <mesh castShadow position={[0, 1.18, 0]}>
        <capsuleGeometry args={[0.34, 0.68, 5, 10]} />
        <meshStandardMaterial color="#d5c7a4" roughness={0.64} />
      </mesh>
      <mesh castShadow position={[0, 1.87, 0]}>
        <sphereGeometry args={[0.23, 18, 14]} />
        <meshStandardMaterial color="#d3a887" roughness={0.68} />
      </mesh>
      <mesh position={[0, 2.22, 0]}>
        <sphereGeometry args={[0.25, 16, 10]} />
        <meshStandardMaterial color="#43332c" roughness={0.8} />
      </mesh>
      <Html position={[0, 2.7, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
        <div className="npcMarker"><span>✦</span><b>Maelis</b><small>Guardiã da fronteira</small></div>
      </Html>
      <mesh position={[0, 1.1, 0]} onClick={(event) => { event.stopPropagation(); onSelect() }}>
        <cylinderGeometry args={[0.8, 0.8, 2.4, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

function WorldScene({
  playerData,
  playerPosition,
  monsters,
  targetId,
  queuedSkill,
  target,
  onMove,
  onAttackReady,
  onSelectMonster,
  onOpenGuide,
  controlsLocked,
}) {
  const controls = useRef()
  const grass = useMemo(() => Array.from({ length: 74 }, (_, index) => {
    const angle = index * 2.399
    const radius = 13 + (index % 8) * 2.2
    return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
  }), [])
  const particles = useMemo(() => Array.from({ length: 80 }, (_, index) => [
    Math.sin(index * 19.13) * 26,
    1 + (index * 7 % 22),
    Math.cos(index * 13.7) * 26,
  ]), [])

  return (
    <>
      <color attach="background" args={['#a8c6ce']} />
      <fog attach="fog" args={['#b0c9c8', 28, 94]} />
      <ambientLight intensity={0.78} color="#d8e7df" />
      <hemisphereLight skyColor="#d9f0f4" groundColor="#405344" intensity={1.05} />
      <directionalLight position={[-18, 28, 14]} intensity={2.25} color="#ffe1ad" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-far={90} shadow-camera-left={-32} shadow-camera-right={32} shadow-camera-top={32} shadow-camera-bottom={-32} />
      <Sky distance={450000} sunPosition={[-0.5, 0.28, -0.4]} inclination={0.48} azimuth={0.24} rayleigh={2.2} turbidity={8} />
      <Stars radius={110} depth={28} count={900} factor={2.3} saturation={0.12} fade speed={0.2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <planeGeometry args={[240, 240, 100, 100]} />
        <meshStandardMaterial color="#55775d" roughness={0.96} />
      </mesh>
      <mesh position={[0, -0.38, -42]} receiveShadow>
        <cylinderGeometry args={[90, 110, 0.7, 48]} />
        <meshStandardMaterial color="#334c48" roughness={1} />
      </mesh>
      <mesh position={[1, 0.03, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[8.4, 48]} />
        <meshStandardMaterial color="#839080" roughness={0.96} />
      </mesh>
      <mesh position={[1, 0.045, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8.5, 8.75, 48]} />
        <meshStandardMaterial color="#c5aa78" roughness={0.8} />
      </mesh>
      <mesh position={[1, 0.06, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.2, 5.28, 48]} />
        <meshBasicMaterial color="#a8c5a5" transparent opacity={0.45} />
      </mesh>

      {grass.map((position, index) => <Tree key={index} position={position} scale={0.8 + index % 4 * 0.12} />)}
      <Ruin position={[-11, 0, -14]} height={4.2} />
      <Ruin position={[14, 0, -12]} height={3.1} />
      <Ruin position={[17, 0, 8]} height={4.8} />
      <Ruin position={[-17, 0, 12]} height={3.6} />
      <mesh position={[0, 2.8, -17]} rotation={[0, 0, 0.12]}>
        <torusGeometry args={[3.8, 0.18, 12, 64]} />
        <meshStandardMaterial color="#9a8262" metalness={0.58} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.8, -17]}>
        <torusGeometry args={[2.6, 0.07, 8, 48]} />
        <meshBasicMaterial color="#71dcd3" />
      </mesh>
      <Crystal position={[0, 3.35, -17]} color="#74ddd0" scale={1.3} />
      <Crystal position={[-9, 0.9, -13]} color="#e4a960" scale={0.72} />
      <Crystal position={[15, 1.4, 9]} color="#8b9de2" scale={0.82} />

      {[[-21, 14, -20], [-27, 20, -37], [24, 16, -39], [34, 23, -27]].map(([x, y, z], index) => (
        <group key={index} position={[x, y, z]}>
          <mesh castShadow><dodecahedronGeometry args={[2.7 + index % 2, 0]} /><meshStandardMaterial color="#657976" roughness={0.9} /></mesh>
          <mesh position={[0, -2.2, 0]}><cylinderGeometry args={[0.8, 2.2, 2.7, 7]} /><meshStandardMaterial color="#556c67" roughness={0.9} /></mesh>
          <pointLight color="#7ccac5" intensity={0.6} distance={10} />
        </group>
      ))}
      {particles.map((position, index) => (
        <mesh key={index} position={position} scale={index % 7 === 0 ? 0.07 : 0.035}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color={index % 4 === 0 ? '#f3d495' : '#82e1d3'} transparent opacity={0.55} />
        </mesh>
      ))}

      <Guide onSelect={onOpenGuide} />
      {monsters.map((monster) => (
        <Monster key={monster.id} monster={monster} selected={targetId === monster.id} onSelect={onSelectMonster} />
      ))}
      <PlayerController
        raceId={playerData.race}
        position={playerPosition}
        queuedSkill={queuedSkill?.id}
        targetPosition={queuedSkill && target ? target.position : null}
        targetRange={queuedSkill?.range ?? 0}
        locked={controlsLocked}
        onMove={onMove}
        onAttackReady={onAttackReady}
      />
      <OrbitControls
        ref={controls}
        target={[playerPosition[0], 1, playerPosition[2]]}
        enablePan={false}
        minDistance={4.5}
        maxDistance={15}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2.08}
        mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
        maxAzimuthAngle={Math.PI}
        minAzimuthAngle={-Math.PI}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  )
}

function Bar({ value, max, type, label }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="statBar">
      <div className={`statBarFill ${type}`} style={{ width: `${percent}%` }} />
      <span>{label}: {Math.ceil(value)} / {max}</span>
    </div>
  )
}

function GameModal({ title, eyebrow, onClose, children, className = '' }) {
  return (
    <div className="modalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className={`gameModal ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <button className="modalClose" onClick={onClose} aria-label="Fechar">×</button>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  )
}

export default function NorthyonGame() {
  const saved = useMemo(readSave, [])
  const [screen, setScreen] = useState('menu')
  const [nickname, setNickname] = useState('')
  const [selectedRace, setSelectedRace] = useState('humano')
  const [playerData, setPlayerData] = useState(null)
  const [playerPosition, setPlayerPosition] = useState([0, 0, 1])
  const playerPositionRef = useRef(playerPosition)
  const [monsters, setMonsters] = useState(() => species.map((monster) => ({ ...monster, maxHp: monster.hp })))
  const [targetId, setTargetId] = useState(null)
  const [queuedSkill, setQueuedSkill] = useState(null)
  const [logs, setLogs] = useState(['A bruma recua. Alguma coisa antiga despertou sob estas ruínas.'])
  const [modal, setModal] = useState('')
  const [quest, setQuest] = useState(initialQuest)
  const [gold, setGold] = useState(24)
  const [inventory, setInventory] = useState([{ name: 'Poção vital', icon: '✚', quantity: 3 }, { name: 'Fragmento de Aether', icon: '✦', quantity: 1 }])
  const [storageWarning, setStorageWarning] = useState(false)
  const respawnTimers = useRef([])
  const target = monsters.find((monster) => monster.id === targetId && monster.hp > 0) ?? null
  const race = playerData ? races[playerData.race] : races[selectedRace]

  const addLog = useCallback((message) => {
    setLogs((previous) => [...previous.slice(-5), message])
  }, [])

  const saveCurrentGame = useCallback(() => {
    if (!playerData) return
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify({
        playerData,
        playerPosition: playerPositionRef.current,
        quest,
        gold,
        inventory,
      }))
      setStorageWarning(false)
    } catch (error) {
      console.error('Não foi possível salvar o progresso local de NORTHYON.', error)
      setStorageWarning(true)
    }
  }, [gold, inventory, playerData, quest])

  useEffect(() => {
    if (playerData && screen === 'game') saveCurrentGame()
  }, [playerData, quest, gold, inventory, screen, saveCurrentGame])

  useEffect(() => {
    const interval = window.setInterval(saveCurrentGame, 60000)
    const beforeUnload = () => saveCurrentGame()
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('beforeunload', beforeUnload)
      respawnTimers.current.forEach(window.clearTimeout)
    }
  }, [saveCurrentGame])

  const beginGame = (character, save = null) => {
    setPlayerData(character)
    setPlayerPosition(save?.playerPosition ?? [0, 0, 1])
    playerPositionRef.current = save?.playerPosition ?? [0, 0, 1]
    if (save?.quest) setQuest(save.quest)
    if (save?.gold !== undefined) setGold(save.gold)
    if (save?.inventory) setInventory(save.inventory)
    setTargetId(null)
    setScreen('game')
    setLogs((previous) => [...previous.slice(-4), `Você chegou aos ${races[character.race].region}.`, 'A Guardiã Maelis aguarda perto do monólito.'])
  }

  const createCharacter = () => {
    const cleanName = nickname.trim()
    if (cleanName.length < 3 || cleanName.length > 16) {
      addLog('Seu nome precisa ter entre 3 e 16 caracteres.')
      return
    }
    beginGame(makeCharacter(cleanName, selectedRace))
  }

  const openGuide = () => {
    setModal('quest')
  }

  const acceptQuest = () => {
    setQuest((previous) => ({ ...previous, status: 'active' }))
    setModal('')
    addLog('Missão aceita: Ecos na fronteira.')
  }

  const completeQuest = () => {
    setQuest((previous) => ({ ...previous, status: 'complete' }))
    setGold((value) => value + 75)
    setInventory((items) => items.map((item) => item.name === 'Fragmento de Aether' ? { ...item, quantity: item.quantity + 2 } : item))
    setPlayerData((previous) => {
      if (!previous) return previous
      const nextXp = previous.xp + 80
      let level = previous.level
      let xpToNext = previous.xpToNext
      let xp = nextXp
      let freeAttributePoints = previous.freeAttributePoints
      let maxHp = previous.maxHp
      let maxMp = previous.maxMp
      while (xp >= xpToNext) {
        xp -= xpToNext
        level += 1
        xpToNext = Math.round(xpToNext * 1.35)
        freeAttributePoints += 5
        maxHp += 18
        maxMp += 10
      }
      return { ...previous, level, xp, xpToNext, freeAttributePoints, maxHp, maxMp, hp: maxHp, mp: maxMp }
    })
    setModal('')
    addLog('Missão concluída! +80 XP, +75 moedas e fragmentos de Aether.')
  }

  const attackTarget = useCallback((skillId) => {
    const skill = skills.find((item) => item.id === skillId)
    if (!skill || !target) {
      setQueuedSkill(null)
      return
    }
    const attacker = playerData
    if (!attacker) return
    const random = Math.random()
    const critical = random < Math.min(0.08 + attacker.dex * 0.006, 0.34)
    const baseAttack = attacker.str * 1.7 + attacker.dex * 0.85 + 8
    const damage = Math.max(8, Math.round((baseAttack + skill.damage - target.level * 2) * (critical ? 1.65 : 1)))
    const enemyAfterHit = Math.max(0, target.hp - damage)
    setMonsters((previous) => previous.map((monster) => monster.id === target.id ? { ...monster, hp: enemyAfterHit } : monster))
    setPlayerData((previous) => previous ? { ...previous, mp: Math.min(previous.maxMp, previous.mp - skill.cost + 1) } : previous)
    setQueuedSkill(null)
    addLog(`${critical ? 'CRÍTICO! ' : ''}${skill.label}: ${damage} de dano em ${target.name}.`)

    if (enemyAfterHit === 0) {
      setTargetId(null)
      setGold((value) => value + 8 + target.level * 3)
      setPlayerData((previous) => {
        if (!previous) return previous
        let level = previous.level
        let xp = previous.xp + target.reward
        let xpToNext = previous.xpToNext
        let freeAttributePoints = previous.freeAttributePoints
        let maxHp = previous.maxHp
        let maxMp = previous.maxMp
        while (xp >= xpToNext) {
          xp -= xpToNext
          level += 1
          xpToNext = Math.round(xpToNext * 1.35)
          freeAttributePoints += 5
          maxHp += 18
          maxMp += 10
        }
        if (level > previous.level) addLog(`Nível ${level}! Você recebeu 5 pontos de atributo.`)
        return { ...previous, level, xp, xpToNext, freeAttributePoints, maxHp, maxMp, hp: Math.min(maxHp, previous.hp + 18), mp: Math.min(maxMp, previous.mp + 10) }
      })
      if (quest.status === 'active') {
        setQuest((previous) => ({ ...previous, kills: Math.min(3, previous.kills + 1) }))
      }
      addLog(`${target.name} foi derrotado. +${target.reward} XP.`)
      const timer = window.setTimeout(() => {
        setMonsters((previous) => previous.map((monster) => monster.id === target.id ? { ...monster, hp: monster.maxHp } : monster))
      }, 14000)
      respawnTimers.current.push(timer)
      return
    }
  }, [addLog, playerData, quest.status, target])

  const useSkill = (skillId) => {
    if (!playerData) return
    if (skillId === 'potion') {
      if (playerData.hp >= playerData.maxHp) {
        addLog('Sua vida já está completa.')
        return
      }
      const potion = inventory.find((item) => item.name === 'Poção vital' && item.quantity > 0)
      if (!potion) {
        addLog('Você não tem poções vitais.')
        return
      }
      setInventory((items) => items.map((item) => item.name === 'Poção vital' ? { ...item, quantity: item.quantity - 1 } : item))
      setPlayerData((previous) => previous ? { ...previous, hp: Math.min(previous.maxHp, previous.hp + 65) } : previous)
      addLog('Poção vital usada. +65 HP.')
      return
    }
    const skill = skills.find((item) => item.id === skillId)
    if (!target) {
      addLog('Selecione uma criatura antes de atacar.')
      return
    }
    if (playerData.mp < skill.cost) {
      addLog('Mana insuficiente para essa habilidade.')
      return
    }
    const position = playerPositionRef.current
    const distance = Math.hypot(target.position[0] - position[0], target.position[2] - position[2])
    if (distance <= skill.range) attackTarget(skillId)
    else {
      setQueuedSkill(skill)
      addLog(`Avançando até ${target.name}...`)
    }
  }

  const onPlayerMove = useCallback((position) => {
    playerPositionRef.current = position
    setPlayerPosition(position)
  }, [])

  const addAttribute = (attribute) => {
    if (!playerData || playerData.freeAttributePoints <= 0) return
    setPlayerData((previous) => {
      if (!previous || previous.freeAttributePoints <= 0) return previous
      const updated = { ...previous, freeAttributePoints: previous.freeAttributePoints - 1, [attribute]: previous[attribute] + 1 }
      if (attribute === 'vit') {
        updated.maxHp += 8
        updated.hp = Math.min(updated.maxHp, updated.hp + 8)
      }
      if (attribute === 'int') {
        updated.maxMp += 6
        updated.mp = Math.min(updated.maxMp, updated.mp + 6)
      }
      return updated
    })
    addLog(`Ponto aplicado em ${attribute.toUpperCase()}.`)
  }

  useEffect(() => {
    if (screen !== 'game') return undefined
    const handleKey = (event) => {
      if (event.target instanceof HTMLInputElement) return
      const key = event.key.toLowerCase()
      if (modal) {
        if (key === 'escape' || (modal === 'inventory' && key === 'i') || (modal === 'character' && key === 'c') || (modal === 'map' && key === 'm')) {
          setModal('')
        }
        return
      }
      if (key === 'i') setModal((current) => current === 'inventory' ? '' : 'inventory')
      if (key === 'c') setModal((current) => current === 'character' ? '' : 'character')
      if (key === 'm') setModal((current) => current === 'map' ? '' : 'map')
      if (key === 'e') {
        const distance = Math.hypot(playerPositionRef.current[0] + 3.7, playerPositionRef.current[2] + 5.6)
        if (distance <= 7) openGuide()
        else addLog('Maelis está longe. Siga o marcador dourado.')
      }
      if (key === 'escape') {
        setModal('')
        setTargetId(null)
        setQueuedSkill(null)
      }
      const selectedSkill = skills.find((skill) => skill.key === event.key)
      if (selectedSkill) useSkill(selectedSkill.id)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [screen, playerData, target, inventory, modal])

  const continueGame = () => {
    if (saved) beginGame(saved.playerData, saved)
  }

  return (
    <main className="northyonApp">
      {screen === 'menu' && (
        <div className="titleScreen">
          <div className="titleAtmosphere" />
          <div className="titleContent">
            <div className="crest" aria-hidden="true"><span>✦</span><i /></div>
            <p className="eyebrow">UMA LENDA DESPERTA</p>
            <h1>NORTHYON</h1>
            <p className="titleSubtitle">REALMS OF ETERNITY</p>
            <div className="titleDivider"><i /><span>✧</span><i /></div>
            <p className="titleCopy">O céu se partiu. O Aether chama.<br />Seu destino ainda não foi escrito.</p>
            <div className="titleActions">
              {saved && <button className="buttonPrimary" onClick={continueGame}>CONTINUAR JORNADA</button>}
              <button className="buttonPrimary" onClick={() => setScreen('create')}>{saved ? 'NOVA JORNADA' : 'INICIAR JORNADA'}</button>
              <button className="buttonText" onClick={() => setModal('lore')}>A HISTÓRIA DE NORTHYON</button>
            </div>
            <span className="titleFootnote">UMA AVENTURA DE FANTASIA ORIGINAL · ACESSO ANTECIPADO</span>
          </div>
          <div className="titleCoordinates">48° N · FRONTEIRA DE AURORA</div>
        </div>
      )}

      {screen === 'create' && (
        <div className="creationScreen">
          <button className="backLink" onClick={() => setScreen('menu')}>← VOLTAR AO MENU</button>
          <div className="creationPreview">
            <div className="previewGlow" style={{ '--accent': race.accent }} />
            <Canvas shadows camera={{ position: [0, 2.25, 7.4], fov: 34 }}>
              <ambientLight intensity={1.25} />
              <directionalLight position={[-4, 7, 4]} intensity={2.2} castShadow />
              <pointLight position={[3, 2, -2]} color={race.accent} intensity={12} distance={8} />
              <CharacterModel raceId={selectedRace} preview />
              <OrbitControls target={[0, 1.2, 0]} enablePan={false} enableZoom={false} minPolarAngle={1.2} maxPolarAngle={1.8} />
            </Canvas>
            <div className="previewCaption"><span>PRÉVIA DO PERSONAGEM</span><b>{race.city}</b></div>
          </div>
          <section className="creationPanel">
            <p className="eyebrow">A PRIMEIRA ESCOLHA</p>
            <h2>Quem será sua lenda?</h2>
            <p className="creationLead">Três povos. Três caminhos para a mesma verdade.</p>
            <label className="inputLabel" htmlFor="character-name">NOME DO AVENTUREIRO</label>
            <input
              id="character-name"
              className="nicknameInput"
              value={nickname}
              onChange={(event) => setNickname(event.target.value.slice(0, 16))}
              onKeyDown={(event) => { if (event.key === 'Enter') createCharacter() }}
              placeholder="Escolha um nome (3–16)"
              autoComplete="off"
              maxLength={16}
            />
            <div className="raceCards">
              {Object.entries(races).map(([raceId, option]) => (
                <button
                  key={raceId}
                  className={`raceCard ${selectedRace === raceId ? 'active' : ''}`}
                  onClick={() => setSelectedRace(raceId)}
                  style={{ '--race-accent': option.accent }}
                  aria-pressed={selectedRace === raceId}
                >
                  <span className={`raceSigil ${raceId}`}>{raceId === 'humano' ? '⌁' : raceId === 'alado' ? '♢' : 'ᛟ'}</span>
                  <span><b>{option.name}</b><small>{option.archetype}</small></span>
                  <i>{selectedRace === raceId ? '●' : '○'}</i>
                </button>
              ))}
            </div>
            <div className="raceDescription">
              <span className="eyebrow">{race.className} · {race.city}</span>
              <p>{race.description}</p>
              <div className="raceStats">
                <span>FOR <b>{race.base.str}</b></span><span>DES <b>{race.base.dex}</b></span><span>INT <b>{race.base.int}</b></span><span>VIT <b>{race.base.vit}</b></span>
              </div>
            </div>
            <button className="buttonPrimary createButton" onClick={createCharacter}>ENTRAR EM NORTHYON <span>→</span></button>
            <p className="localSaveNote">Seu progresso é salvo neste navegador.</p>
          </section>
        </div>
      )}

      {screen === 'game' && playerData && (
        <div className="gameShell">
          <Canvas shadows dpr={[1, 1.65]} camera={{ position: [0, 4.4, 7.6], fov: 52 }}>
            <WorldScene
              playerData={playerData}
              playerPosition={playerPosition}
              monsters={monsters}
              targetId={targetId}
              target={target}
              queuedSkill={queuedSkill}
              onMove={onPlayerMove}
              onAttackReady={attackTarget}
              onSelectMonster={(monster) => {
                setTargetId(monster.id)
                setQueuedSkill(null)
                addLog(`Alvo selecionado: ${monster.name} · Nv. ${monster.level}.`)
              }}
              onOpenGuide={openGuide}
              controlsLocked={Boolean(modal)}
            />
          </Canvas>
          <div className="gameVignette" />
          <div className="gameHud">
            <section className="playerCard hudPanel">
              <div className="portraitFrame" style={{ '--accent': race.accent }}>
                <div className={`portraitSilhouette ${playerData.race}`}><span>✦</span></div>
                <b>{playerData.level}</b>
              </div>
              <div className="playerDetails">
                <div className="playerNameRow"><b>{playerData.nickname}</b><span>Nv. {playerData.level}</span></div>
                <p>{race.name} · {race.className}</p>
                <Bar value={playerData.hp} max={playerData.maxHp} type="health" label="HP" />
                <Bar value={playerData.mp} max={playerData.maxMp} type="mana" label="MP" />
              </div>
            </section>

            <div className="worldHeading"><span>REGIÃO DE FRONTEIRA</span><b>{race.region}</b><i>O Aether está instável</i></div>

            <div className="minimapWrap">
              <div className="minimap">
                <div className="mapLand mapLandOne" /><div className="mapLand mapLandTwo" />
                <span className="mapRoad" /><span className="mapCrystal">✦</span><span className="mapNpc">◆</span>
                {monsters.filter((monster) => monster.hp > 0).map((monster) => <i key={monster.id} className="mapEnemy" style={{ left: `${50 + monster.position[0] * 1.15}%`, top: `${50 + monster.position[2] * 1.15}%` }} />)}
                <div className="mapPlayer"><i /></div>
              </div>
              <div className="mapCaption"><b>FRONTEIRA DE AURORA</b><span>X {playerPosition[0].toFixed(0)} · Z {playerPosition[2].toFixed(0)}</span></div>
              <button className="mapExpand" onClick={() => setModal('map')}>M</button>
            </div>

            {target && (
              <section className="targetCard hudPanel">
                <div className="targetEmblem">✦</div>
                <div><span>CRIATURA CORROMPIDA · NV. {target.level}</span><b>{target.name}</b><Bar value={target.hp} max={target.maxHp} type="enemy" label="HP" /></div>
              </section>
            )}

            <div className="questTracker hudPanel">
              <div className="questHeader"><span>✦</span><b>MISSÃO PRINCIPAL</b><button onClick={() => setModal('quest')}>⋯</button></div>
              <h3>{quest.status === 'complete' ? 'Ecos na fronteira ✓' : 'Ecos na fronteira'}</h3>
              <p>{quest.status === 'available' ? 'Fale com Maelis para investigar a corrupção.' : quest.status === 'complete' ? 'A fronteira está segura, por enquanto.' : 'Derrote criaturas corrompidas.'}</p>
              {quest.status === 'active' && <div className="questProgress"><i style={{ width: `${Math.min(100, quest.kills / 3 * 100)}%` }} /><span>{quest.kills} / 3</span></div>}
            </div>

            <div className="combatLog">{logs.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>

            <div className="bottomHud">
              <div className="xpLine"><span>XP</span><div><i style={{ width: `${Math.min(100, playerData.xp / playerData.xpToNext * 100)}%` }} /></div><b>{playerData.xp} / {playerData.xpToNext}</b></div>
              <div className="skillBar">
                {skills.map((skill) => (
                  <button key={skill.id} className={`skillSlot ${queuedSkill?.id === skill.id ? 'queued' : ''}`} onClick={() => useSkill(skill.id)} title={`${skill.label} · tecla ${skill.key}`}>
                    <span className="skillKey">{skill.key}</span><b>{skill.icon}</b><small>{skill.label}</small>
                    {skill.id !== 'potion' && <i>{skill.cost ? `${skill.cost} MP` : '0 MP'}</i>}
                    {skill.id === 'potion' && <em>{inventory.find((item) => item.name === 'Poção vital')?.quantity ?? 0}</em>}
                  </button>
                ))}
                <span className="skillDivider" />
                <button className="utilitySlot" onClick={() => setModal('inventory')} title="Inventário (I)">I</button>
                <button className="utilitySlot" onClick={() => setModal('character')} title="Personagem (C)">C</button>
              </div>
            </div>
            <div className="controlsPill"><span>WASD</span> mover <span>SHIFT</span> correr <span>ESPAÇO</span> saltar <span>BOTÃO DIREITO</span> câmera</div>
            {storageWarning && <div className="saveWarning">Não foi possível salvar neste navegador.</div>}
            <button className="exitButton" onClick={() => { saveCurrentGame(); setScreen('menu') }}>PAUSAR / SALVAR <span>Ⅱ</span></button>
          </div>
        </div>
      )}

      {modal === 'lore' && (
        <GameModal title="Quando o céu se partiu" eyebrow="A LENDA DE NORTHYON" onClose={() => setModal('')}>
          <div className="loreText">
            <p>Antes das três coroas, uma civilização ergueu o <strong>Coração da Eternidade</strong> para conter a instabilidade do Aether. Na noite de sua ativação, o céu se abriu: continentes se partiram, cidades afundaram e algo respondeu do outro lado do Véu.</p>
            <p>Hoje, três luzes voltaram a cruzar o firmamento. Na fronteira, criaturas mudam diante dos olhos de quem as observa. Os antigos fragmentos estão despertando — e cada povo teme uma verdade diferente.</p>
            <p className="loreQuote">Você não foi escolhido. Você decidiu olhar para as ruínas.</p>
          </div>
          <button className="buttonPrimary modalAction" onClick={() => { setModal(''); setScreen('create') }}>ESCOLHER MEU CAMINHO</button>
        </GameModal>
      )}

      {modal === 'quest' && playerData && (
        <GameModal title="Ecos na fronteira" eyebrow="MAELIS · GUARDIÃ DE AURORA" onClose={() => setModal('')}>
          <div className="dialogPortrait"><span>✦</span></div>
          {quest.status === 'available' ? (
            <>
              <p className="dialogText">“A bruma mudou. As criaturas avançam sem medo, e há luz saindo das ruínas. Investigue a fronteira e derrote <strong>três seres corrompidos</strong>. Traga-me qualquer fragmento que encontrar.”</p>
              <div className="questReward"><span>RECOMPENSA</span><b>80 XP</b><b>75 moedas</b><b>Fragmentos de Aether</b></div>
              <button className="buttonPrimary modalAction" onClick={acceptQuest}>ACEITAR MISSÃO</button>
            </>
          ) : quest.status === 'active' && quest.kills < 3 ? (
            <>
              <p className="dialogText">“A fronteira ainda não está segura. Continue enfrentando as criaturas corrompidas; cada uma delas está ligada ao mesmo pulso de Aether.”</p>
              <div className="questReward"><span>PROGRESSO</span><b>{quest.kills} / 3 criaturas</b></div>
              <button className="buttonSecondary modalAction" onClick={() => setModal('')}>VOLTAR À FRONTEIRA</button>
            </>
          ) : quest.status === 'active' ? (
            <>
              <p className="dialogText">“Você sentiu também? A mesma marca pulsa em cada criatura. Isto não é uma invasão — é um chamado. Receba o que lhe devo, mas mantenha os olhos nas ruínas.”</p>
              <div className="questReward"><span>OBJETIVO COMPLETO</span><b>3 / 3 criaturas derrotadas</b></div>
              <button className="buttonPrimary modalAction" onClick={completeQuest}>CONCLUIR E RECEBER RECOMPENSA</button>
            </>
          ) : (
            <>
              <p className="dialogText">“A fronteira respira por mais um dia. O fragmento que encontrou pertence a algo maior do que qualquer coroa. Ainda não sabemos o quê.”</p>
              <div className="questReward"><span>MISSÃO CONCLUÍDA</span><b>Um novo caminho se abriu.</b></div>
              <button className="buttonSecondary modalAction" onClick={() => setModal('')}>FECHAR DIÁLOGO</button>
            </>
          )}
        </GameModal>
      )}

      {modal === 'inventory' && playerData && (
        <GameModal title="Mochila de viagem" eyebrow="INVENTÁRIO · 24 ESPAÇOS" onClose={() => setModal('')} className="inventoryModal">
          <div className="inventoryGrid">
            {Array.from({ length: 24 }, (_, index) => {
              const item = inventory[index]
              return <div key={index} className={`inventorySlot ${item ? 'hasItem' : ''}`} title={item?.name ?? 'Espaço vazio'}>{item && <><b>{item.icon}</b><span>{item.name}</span><i>{item.quantity}</i></>}</div>
            })}
          </div>
          <div className="inventoryFooter"><span>✦ {gold} MOEDAS</span><p>Poções podem ser usadas pela tecla 3.</p></div>
        </GameModal>
      )}

      {modal === 'character' && playerData && (
        <GameModal title={playerData.nickname} eyebrow={`${race.name.toUpperCase()} · ${race.className.toUpperCase()} · NÍVEL ${playerData.level}`} onClose={() => setModal('')} className="characterModal">
          <div className="attributePoints">PONTOS LIVRES <b>{playerData.freeAttributePoints}</b></div>
          <div className="attributeList">
            {[
              ['str', 'Força', 'Dano físico'],
              ['dex', 'Destreza', 'Precisão e crítico'],
              ['int', 'Intelecto', 'Reserva de mana'],
              ['vit', 'Vitalidade', 'Vida e defesa'],
            ].map(([key, label, description]) => (
              <div className="attributeRow" key={key}><span><b>{label}</b><small>{description}</small></span><strong>{playerData[key]}</strong><button disabled={playerData.freeAttributePoints <= 0} onClick={() => addAttribute(key)}>+</button></div>
            ))}
          </div>
          <div className="characterStatsFooter"><span>ATAQUE <b>{Math.round(playerData.str * 1.7 + playerData.dex * 0.85 + 8)}</b></span><span>HP MÁX. <b>{playerData.maxHp}</b></span><span>MP MÁX. <b>{playerData.maxMp}</b></span></div>
        </GameModal>
      )}

      {modal === 'map' && playerData && (
        <GameModal title="Fronteira de Aurora" eyebrow="MAPA REGIONAL" onClose={() => setModal('')} className="mapModal">
          <div className="largeMap">
            <span className="largeMapPath" />
            <span className="largeMapCrystal">✦</span>
            <span className="largeMapGuide">◆<small>MAELIS</small></span>
            <span className="largeMapPlayer">●<small>VOCÊ</small></span>
            {monsters.filter((monster) => monster.hp > 0).map((monster) => <span key={monster.id} className="largeMapEnemy" style={{ left: `${50 + monster.position[0] * 1.5}%`, top: `${50 + monster.position[2] * 1.5}%` }}>•</span>)}
          </div>
          <p className="mapLegend">◆ Guardiã <span>• Criaturas corrompidas</span> ✦ Monólito de Aether</p>
        </GameModal>
      )}
    </main>
  )
}
