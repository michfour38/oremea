\# EL DATA MODEL



The data model exists to support:



Recognition

↓

Responsibility

↓

Movement



The data model should be independent of Compass.



Compass consumes EL.



EL remains reusable.



\---



\# Evidence



type Evidence = {

id: string



type:

| "reality"

| "resource"

| "strength"

| "possibility"

| "choice"

| "objection"

| "movement"



content: string



confidence: number



source:

| "participant"

| "memory"

| "completed\_action"



timestamp: string

}



\---



\# Observation



type Observation = {

id: string



type:

| "reality"

| "resource"

| "strength"

| "possibility"

| "choice"

| "objection"

| "movement"

| "contradiction"

| "activation"



confidence: number



evidenceIds: string\[]



summary: string

}



\---



\# Scores



type EngineScores = {

realityDensity: number

momentum: number

friction: number

confidence: number

agency: number

leverage: number

activation: number

drift: number

}



Range:



0-100



For all scores.



\---



\# State



type EngineState =

| "unclear"

| "choice\_forming"

| "resource\_missing"

| "resource\_identified"

| "possibility\_emerging"

| "objection\_present"

| "movement\_ready"

| "movement\_current"



\---



\# Reality



type Reality = {

id: string



description: string



ownershipScore: number



realityDistance: number



coherenceScore: number



isCurrent: boolean

}



\---



\# Horizon



type Horizon = {

id: string



parentRealityId: string



description: string



distanceScore: number



completed: boolean

}



\---



\# Bridge



type Bridge = {

id: string



currentRealityId: string



targetRealityId: string



horizonIds: string\[]



strengthScore: number

}



\---



\# Memory



type Memory = {

completedRealities: Reality\[]



completedActions: string\[]



successfulMovementPatterns: string\[]



leverageEvents: string\[]



trajectories: string\[]

}



\---



\# Engine Tick



type EngineTick = {

id: string



participantResponse: string



evidence: Evidence\[]



observations: Observation\[]



scores: EngineScores



primaryState: EngineState



selectedQuestion: string



timestamp: string

}



