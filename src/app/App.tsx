import { useState, useEffect, useMemo, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Check,
  Trash2,
  Dumbbell,
  ClipboardList,
  BarChart3,
  Calendar,
  User,
  Activity,
  FileDown,
  Search,
  Settings,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

// ─── Google API types ────────────────────────────────────────────────────────

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (r: { access_token: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface Exercise {
  id: string;
  name: string;
  anatomicalAction: string;
  muscleGroup: string;
  sets: string;
  reps: string;
  intensity: string;
  rest: string;
  gray?: boolean;
  asterisk?: boolean;
}

type MuscleGroup =
  | "Peito"
  | "Costas"
  | "Ombro"
  | "Bíceps"
  | "Tríceps"
  | "Pernas"
  | "Gluteos"
  | "Panturrilhas"
  | "Core"
  | "Cardio"
  | "Alongamento"
  | "Aquecimento";

const MUSCLE_GROUPS: MuscleGroup[] = [
  "Peito",
  "Costas",
  "Ombro",
  "Bíceps",
  "Tríceps",
  "Pernas",
  "Gluteos",
  "Panturrilhas",
  "Core",
  "Cardio",
  "Alongamento",
  "Aquecimento",
];

const MUSCLE_COLOR: Record<string, string> = {
  "Peito":        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Costas":       "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Ombro":        "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Bíceps":       "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "Tríceps":      "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Pernas":       "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Gluteos":      "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Panturrilhas": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Core":         "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Cardio":       "bg-primary/10 text-primary border-primary/20",
  "Alongamento":  "bg-lime-500/10 text-lime-400 border-lime-500/20",
  "Aquecimento":  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

// ─── Exercise Library ────────────────────────────────────────────────────────

const LIBRARY: Record<string, { name: string; anatomicalAction: string }[]> = {
  Peito: [
    { name: "Banco supino reto (Barra reta 1,50m + anilhas)", anatomicalAction: "Adução horizontal do ombro" },
    { name: "Banco supino reto (Barra reta 1,80m + anilhas)", anatomicalAction: "Adução horizontal do ombro" },
    { name: "Banco supino reto (Halteres)", anatomicalAction: "Adução horizontal do ombro" },
    { name: "Banco supino inclinado (Barra reta 1,50m + anilhas)", anatomicalAction: "Adução horizontal — porção clavicular" },
    { name: "Banco supino inclinado (Barra reta 1,80m + anilhas)", anatomicalAction: "Adução horizontal — porção clavicular" },
    { name: "Banco supino inclinado (Halteres)", anatomicalAction: "Adução horizontal — porção clavicular" },
    { name: "Banco supino declinado (Barra reta 1,50m + anilhas)", anatomicalAction: "Adução horizontal — porção esternal inferior" },
    { name: "Banco supino declinado (Barra reta 1,80m + anilhas)", anatomicalAction: "Adução horizontal — porção esternal inferior" },
    { name: "Banco supino declinado (Halteres)", anatomicalAction: "Adução horizontal — porção esternal inferior" },
    { name: "Supino máquina articulado (Pegada pronada)", anatomicalAction: "Adução horizontal do ombro e extensão de cotovelo" },
    { name: "Supino máquina articulado (Pegada neutra)", anatomicalAction: "Adução horizontal com maior flexão de ombro" },
    { name: "Supino unilateral máquina articulada (Pegada neutra/pronada)", anatomicalAction: "Adução horizontal isolada e ativação de core anti-rotação" },
    { name: "Supino (Crossover angular)", anatomicalAction: "Adução horizontal e extensão de cotovelo com tensão contínua" },
    { name: "Peck deck", anatomicalAction: "Adução horizontal do ombro isolada" },
    { name: "Voador", anatomicalAction: "Adução horizontal do ombro isolada" },
    { name: "Peitoral dorsal (Máquina)", anatomicalAction: "Adução horizontal do ombro isolada" },
    { name: "Banco crucifixo reto (Halteres)", anatomicalAction: "Adução horizontal do ombro" },
    { name: "Banco crucifixo inclinado (Halteres)", anatomicalAction: "Adução horizontal — porção clavicular" },
    { name: "Banco crucifixo declinado (Halteres)", anatomicalAction: "Adução horizontal — porção esternal inferior" },
    { name: "Crossover (Polia alta)", anatomicalAction: "Adução e flexão do ombro — foco inferior" },
    { name: "Crossover (Polia média)", anatomicalAction: "Adução horizontal do ombro — foco esternal" },
    { name: "Crossover (Polia baixa)", anatomicalAction: "Adução e extensão do ombro — foco clavicular" },
    { name: "Crossover angular (Fechado)", anatomicalAction: "Adução horizontal do ombro com pico de contração" },
    { name: "Flexão de braços (Peso corporal)", anatomicalAction: "Adução horizontal e extensão de cotovelo" },
  ],
  Costas: [
    { name: "Puxador rold. altas (Barra anatômica 1)", anatomicalAction: "Adução da escápula e extensão do ombro" },
    { name: "Puxador rold. altas (Barra anatômica 2)", anatomicalAction: "Adução da escápula e extensão do ombro" },
    { name: "Puxador rold. altas (Barra anatômica 3)", anatomicalAction: "Adução da escápula e extensão do ombro" },
    { name: "Puxador rold. altas (Barra anatômica 4)", anatomicalAction: "Adução da escápula e extensão do ombro" },
    { name: "Puxador rold. altas (Barra anatômica 5)", anatomicalAction: "Adução da escápula e extensão do ombro" },
    { name: "Puxador rold. altas (Barra reta)", anatomicalAction: "Adução da escápula e extensão do ombro" },
    { name: "Puxador rold. altas (Triângulo)", anatomicalAction: "Adução da escápula e extensão do ombro" },
    { name: "Puxador rold. altas (Barra pequena supinada)", anatomicalAction: "Adução da escápula e extensão do ombro" },
    { name: "Puxador rold. altas (Unilateral com estribo)", anatomicalAction: "Adução da escápula e extensão do ombro" },
    { name: "Barra fixa pronada (Peso corporal)", anatomicalAction: "Adução do ombro e depressão escapular" },
    { name: "Barra fixa supinada (Peso corporal)", anatomicalAction: "Extensão do ombro e depressão escapular" },
    { name: "Pulldown na polia (Barra reta)", anatomicalAction: "Extensão do ombro isolada" },
    { name: "Pulldown na polia (Corda)", anatomicalAction: "Extensão do ombro isolada" },
    { name: "Pulldown (Crossover)", anatomicalAction: "Extensão do ombro com maior amplitude" },
    { name: "Pulldown (Crossover angular)", anatomicalAction: "Extensão do ombro com vetor ajustado" },
    { name: "Remada curvada pronada (Barra reta 1,20m + anilhas)", anatomicalAction: "Retração da escápula e extensão do ombro" },
    { name: "Remada curvada pronada (Barra reta 1,50m + anilhas)", anatomicalAction: "Retração da escápula e extensão do ombro" },
    { name: "Remada curvada supinada (Barra reta 1,20m + anilhas)", anatomicalAction: "Retração da escápula e extensão do ombro" },
    { name: "Remada curvada supinada (Barra reta 1,50m + anilhas)", anatomicalAction: "Retração da escápula e extensão do ombro" },
    { name: "Remada unilateral apoiada no banco livre (Halter)", anatomicalAction: "Extensão e adução do ombro unilateral" },
    { name: "Puxador rold. baixas (Barra reta)", anatomicalAction: "Retração da escápula e extensão do ombro" },
    { name: "Puxador rold. baixas (Triângulo)", anatomicalAction: "Retração da escápula e extensão do ombro" },
    { name: "Puxador rold. baixas (Barra anatômica 1)", anatomicalAction: "Retração da escápula e extensão do ombro" },
    { name: "Puxador rold. baixas (Barra pequena supinada)", anatomicalAction: "Retração da escápula e extensão do ombro" },
    { name: "Puxador rold. baixas (Unilateral com estribo)", anatomicalAction: "Retração da escápula e extensão do ombro" },
    { name: "Remada (Crossover angular - Cabos cruzados)", anatomicalAction: "Retração escapular com pico de contração" },
    { name: "Remada articulada máquina (Pegada aberta/pronada)", anatomicalAction: "Retração escapular e abdução horizontal do ombro" },
    { name: "Remada articulada máquina (Pegada fechada/neutra)", anatomicalAction: "Retração escapular e extensão do ombro" },
    { name: "Remada articulada unilateral (Pegada neutra)", anatomicalAction: "Extensão do ombro isolada e ativação oblíqua" },
    { name: "Remada cavalinho (Barra T + anilhas)", anatomicalAction: "Retração da escápula e extensão do ombro" },
    { name: "Remada cavalinho com apoio de peito (Máquina)", anatomicalAction: "Retração escapular isolada sem sobrecarga lombar" },
    { name: "Levantamento terra livre (Barra reta 1,50m + anilhas)", anatomicalAction: "Extensão do quadril e isometria de grande dorsal" },
    { name: "Levantamento terra livre (Barra reta 1,80m + anilhas)", anatomicalAction: "Extensão do quadril e isometria de grande dorsal" },
    { name: "Levantamento terra livre (Halteres)", anatomicalAction: "Extensão do quadril e isometria de grande dorsal" },
    { name: "Levantamento terra (Máquina articulada)", anatomicalAction: "Extensão do quadril com pegada neutra e biomecânica guiada" },
  ],
  Ombro: [
    { name: "Sentado no banco 90° - Desenvolvimento (Barra reta 1,20m + anilhas)", anatomicalAction: "Abdução e flexão do ombro" },
    { name: "Sentado no banco 90° - Desenvolvimento (Halteres)", anatomicalAction: "Abdução e flexão do ombro" },
    { name: "Em pé - Desenvolvimento (Barra reta 1,20m + anilhas)", anatomicalAction: "Abdução e flexão do ombro" },
    { name: "Em pé - Desenvolvimento (Barra reta 1,50m + anilhas)", anatomicalAction: "Abdução e flexão do ombro" },
    { name: "Em pé - Desenvolvimento (Halteres)", anatomicalAction: "Abdução e flexão do ombro" },
    { name: "Desenvolvimento (Máquina articulada)", anatomicalAction: "Abdução e flexão do ombro guiada" },
    { name: "Desenvolvimento (Crossover angular)", anatomicalAction: "Abdução e flexão do ombro com tensão contínua" },
    { name: "Desenvolvimento unilateral (Máquina articulada)", anatomicalAction: "Abdução do ombro e estabilização de core" },
    { name: "Sentado no banco 90° - Desenvolvimento Arnold (Halteres)", anatomicalAction: "Abdução, flexão e rotação externa do ombro" },
    { name: "Sentado no banco 90° - Elevação lateral (Halteres)", anatomicalAction: "Abdução do ombro sem uso de impulso" },
    { name: "Em pé - Elevação lateral (Halteres)", anatomicalAction: "Abdução do ombro (Porção medial)" },
    { name: "Elevação lateral (Polia baixa)", anatomicalAction: "Abdução do ombro com tensão constante" },
    { name: "Elevação lateral cruzando o corpo (Crossover)", anatomicalAction: "Abdução do ombro cruzando o corpo" },
    { name: "Em pé - Elevação frontal (Halteres)", anatomicalAction: "Flexão do ombro (Porção anterior)" },
    { name: "Em pé - Elevação frontal (Barra reta 1,20m + anilhas)", anatomicalAction: "Flexão do ombro (Porção anterior)" },
    { name: "Em pé - Elevação frontal (Anilha)", anatomicalAction: "Flexão do ombro (Porção anterior)" },
    { name: "Elevação frontal (Polia baixa)", anatomicalAction: "Flexão do ombro com tensão contínua" },
    { name: "Elevação frontal entre as pernas (Crossover)", anatomicalAction: "Flexão do ombro com pico de tensão contínuo" },
    { name: "Crucifixo inverso curvado (Halteres)", anatomicalAction: "Abdução horizontal do ombro (Porção posterior)" },
    { name: "Banco inclinado - Crucifixo inverso (Halteres)", anatomicalAction: "Abdução horizontal do ombro com peito apoiado" },
    { name: "Crucifixo inverso (Polia alta)", anatomicalAction: "Abdução horizontal do ombro contínua" },
    { name: "Crucifixo inverso (Peck deck inverso)", anatomicalAction: "Abdução horizontal do ombro" },
    { name: "Crucifixo inverso (Crossover angular)", anatomicalAction: "Abdução horizontal do ombro" },
    { name: "Face pull (Crossover)", anatomicalAction: "Abdução horizontal e rotação externa do ombro" },
    { name: "Face pull (Crossover angular)", anatomicalAction: "Abdução horizontal e rotação externa do ombro" },
    { name: "Em pé - Encolhimento (Halteres)", anatomicalAction: "Elevação escapular" },
    { name: "Em pé - Encolhimento (Barra reta 1,20m + anilhas)", anatomicalAction: "Elevação escapular" },
    { name: "Em pé - Encolhimento (Barra reta 1,50m + anilhas)", anatomicalAction: "Elevação escapular" },
    { name: "Encolhimento (Máquina articulada)", anatomicalAction: "Elevação escapular com pegada neutra pesada" },
  ],
  Bíceps: [
    { name: "Em pé - Rosca direta (Barra reta 1,20m + anilhas)", anatomicalAction: "Flexão do cotovelo supinação completa" },
    { name: "Em pé - Rosca direta (Barra W + anilhas)", anatomicalAction: "Flexão do cotovelo com leve semi-pronação" },
    { name: "Em pé - Rosca direta (Halteres)", anatomicalAction: "Flexão do cotovelo com rotação (supinação)" },
    { name: "Em pé - Rosca alternada (Halteres)", anatomicalAction: "Flexão do cotovelo com rotação" },
    { name: "Em pé - Rosca martelo (Halteres)", anatomicalAction: "Flexão do cotovelo pegada neutra — braquiorradial" },
    { name: "Rosca martelo (Polia baixa com corda)", anatomicalAction: "Flexão do cotovelo pegada neutra com tensão" },
    { name: "Sentado no banco livre - Rosca concentrada (Halter)", anatomicalAction: "Flexão do cotovelo isolada" },
    { name: "Banco Scott livre - Rosca Scott (Barra W + anilhas)", anatomicalAction: "Flexão do cotovelo — ênfase porção curta" },
    { name: "Banco Scott livre - Rosca Scott (Barra reta 1,20m + anilhas)", anatomicalAction: "Flexão do cotovelo — ênfase porção curta" },
    { name: "Banco Scott livre - Rosca Scott (Halteres)", anatomicalAction: "Flexão do cotovelo — ênfase porção curta" },
    { name: "Banco Scott livre - Rosca Scott (Halter unilateral)", anatomicalAction: "Flexão do cotovelo isolada" },
    { name: "Rosca Scott (Máquina)", anatomicalAction: "Flexão do cotovelo guiada" },
    { name: "Rosca no cabo baixo do Crossover (Barra reta)", anatomicalAction: "Flexão do cotovelo com tensão contínua" },
    { name: "Rosca no cabo baixo do Crossover (Corda)", anatomicalAction: "Flexão do cotovelo pegada neutra/supinada" },
    { name: "Rosca dupla (Crossover polias altas)", anatomicalAction: "Flexão do cotovelo com ombro abduzido" },
  ],
  Tríceps: [
    { name: "Banco reto - Tríceps testa (Barra reta 1,20m + anilhas)", anatomicalAction: "Extensão do cotovelo" },
    { name: "Banco reto - Tríceps testa (Barra W + anilhas)", anatomicalAction: "Extensão do cotovelo com semi-pronação" },
    { name: "Banco reto - Tríceps testa (Halteres)", anatomicalAction: "Extensão do cotovelo pegada neutra" },
    { name: "Tríceps pulley (Barra reta)", anatomicalAction: "Extensão do cotovelo" },
    { name: "Tríceps pulley (Barra V)", anatomicalAction: "Extensão do cotovelo ergonômica" },
    { name: "Tríceps pulley (Corda)", anatomicalAction: "Extensão do cotovelo com pronação final" },
    { name: "Tríceps pulley (Crossover angular)", anatomicalAction: "Extensão do cotovelo ajustável à largura dos ombros" },
    { name: "Sentado no banco 90° - Tríceps francês bilateral (Halter)", anatomicalAction: "Extensão do cotovelo acima da cabeça (porção longa)" },
    { name: "Sentado no banco 90° - Tríceps francês unilateral (Halter)", anatomicalAction: "Extensão do cotovelo isolada acima da cabeça" },
    { name: "Tríceps francês na polia baixa (Corda)", anatomicalAction: "Extensão do cotovelo acima da cabeça com tensão" },
    { name: "Tríceps coice (Halter)", anatomicalAction: "Extensão do cotovelo (ombro hiperextendido)" },
    { name: "Tríceps coice na polia baixa (Cabo)", anatomicalAction: "Extensão do cotovelo (ombro hiperextendido)" },
    { name: "Mergulho (Paralelas)", anatomicalAction: "Extensão do cotovelo — peso corporal/sobrecarga" },
    { name: "Mergulho (Banco livre)", anatomicalAction: "Extensão do cotovelo — peso corporal" },
  ],
  Pernas: [
    { name: "Agachamento livre (Barra reta 1,50m + anilhas)", anatomicalAction: "Extensão de joelho e extensão de quadril" },
    { name: "Agachamento livre (Barra reta 1,80m + anilhas)", anatomicalAction: "Extensão de joelho e extensão de quadril" },
    { name: "Agachamento (Smith)", anatomicalAction: "Extensão de joelho e quadril guiada" },
    { name: "Agachamento (Hack Machine)", anatomicalAction: "Extensão de joelho (maior ênfase) e quadril" },
    { name: "Agachamento reverso (Hack Invertido)", anatomicalAction: "Extensão de quadril (foco glúteo/posterior) e joelho" },
    { name: "Agachamento frontal (V-Squat Máquina)", anatomicalAction: "Extensão de joelho com biomecânica adaptada" },
    { name: "Agachamento (Belt Squat)", anatomicalAction: "Extensão de joelho e quadril sem compressão axial" },
    { name: "Agachamento sumô (Belt Squat)", anatomicalAction: "Extensão de joelho, quadril e ênfase adutora" },
    { name: "Agachamento sumô (Halter)", anatomicalAction: "Extensão de joelho, quadril e ênfase adutora" },
    { name: "Agachamento sumô (Barra reta 1,50m + anilhas)", anatomicalAction: "Extensão de joelho, quadril e ênfase adutora" },
    { name: "Afundo livre (Halteres)", anatomicalAction: "Extensão unilateral de quadril e joelho" },
    { name: "Afundo livre (Barra reta 1,20m + anilhas)", anatomicalAction: "Extensão unilateral de quadril e joelho" },
    { name: "Afundo livre (Barra reta 1,50m + anilhas)", anatomicalAction: "Extensão unilateral de quadril e joelho" },
    { name: "Afundo (Smith)", anatomicalAction: "Extensão unilateral guiada de quadril e joelho" },
    { name: "Afundo (Belt Squat)", anatomicalAction: "Extensão unilateral sem compressão de coluna" },
    { name: "Pressão de pernas 45° linear (Leg Press Trilho)", anatomicalAction: "Extensão de quadril e joelho com resistência constante" },
    { name: "Pressão de pernas 45° articulado (Leg Press Alavanca)", anatomicalAction: "Extensão de quadril e joelho com pico de torque variável" },
    { name: "Pressão de pernas horizontal (Máquina)", anatomicalAction: "Extensão de quadril e joelho sentada" },
    { name: "Cadeira extensora (Bilateral)", anatomicalAction: "Extensão do joelho (Isolamento de quadríceps)" },
    { name: "Cadeira extensora (Unilateral)", anatomicalAction: "Extensão isolada de joelho" },
    { name: "Agachamento búlgaro (Halteres)", anatomicalAction: "Extensão unilateral de quadril e joelho com alongamento" },
    { name: "Agachamento búlgaro (Barra reta 1,20m + anilhas)", anatomicalAction: "Extensão unilateral de quadril e joelho" },
    { name: "Agachamento búlgaro (Smith)", anatomicalAction: "Extensão unilateral guiada" },
    { name: "Agachamento búlgaro (Máquina articulada)", anatomicalAction: "Extensão unilateral de quadril (com pegada firme baixa)" },
    { name: "Mesa flexora (Bilateral)", anatomicalAction: "Flexão de joelhos (Isolamento isquiotibiais)" },
    { name: "Mesa flexora (Unilateral)", anatomicalAction: "Flexão de joelho isolada" },
    { name: "Cadeira flexora (Bilateral)", anatomicalAction: "Flexão de joelhos (Foco isquiotibiais com quadril flexionado)" },
    { name: "Cadeira flexora (Unilateral)", anatomicalAction: "Flexão de joelho isolada" },
    { name: "Stiff (Barra reta 1,20m + anilhas)", anatomicalAction: "Extensão do quadril (Joelho estendido/semi-flexionado)" },
    { name: "Stiff (Barra reta 1,50m + anilhas)", anatomicalAction: "Extensão do quadril (Joelho estendido/semi-flexionado)" },
    { name: "Stiff (Barra reta 1,80m + anilhas)", anatomicalAction: "Extensão do quadril (Joelho estendido/semi-flexionado)" },
    { name: "Stiff (Halteres)", anatomicalAction: "Extensão do quadril (Joelho estendido/semi-flexionado)" },
    { name: "Stiff (Máquina articulada)", anatomicalAction: "Extensão do quadril com carga guiada (pegada neutra)" },
    { name: "Cadeira adutora", anatomicalAction: "Adução de quadril" },
    { name: "Adução de coxa (Polias duplas)", anatomicalAction: "Adução de quadril com tensão contínua do cabo" },
  ],
  Gluteos: [
    { name: "Elevação pélvica no solo (Barra reta 1,20m + anilhas)", anatomicalAction: "Extensão de quadril (foco glúteo máximo)" },
    { name: "Elevação pélvica no solo (Barra reta 1,50m + anilhas)", anatomicalAction: "Extensão de quadril (foco glúteo máximo)" },
    { name: "Elevação pélvica (Máquina)", anatomicalAction: "Extensão de quadril (foco glúteo máximo)" },
    { name: "Glúteo coice (Polias duplas)", anatomicalAction: "Extensão unilateral do quadril" },
    { name: "Glúteo perna estendida (Polias duplas)", anatomicalAction: "Extensão de quadril com ênfase em alongamento" },
    { name: "Abdução de quadril (Polias duplas cabo cruzado)", anatomicalAction: "Abdução unilateral de quadril com cabo cruzado" },
    { name: "Abdução de quadril (Polias duplas cabo simples)", anatomicalAction: "Abdução unilateral de quadril" },
    { name: "Cadeira abdutora", anatomicalAction: "Abdução de quadril (Glúteo médio/mínimo)" },
    { name: "Marcha lateral (Belt Squat)", anatomicalAction: "Abdução de quadril com tensão constante inferior" },
    { name: "Glúteo 4 apoios perna estendida (Caneleira)", anatomicalAction: "Extensão de quadril" },
    { name: "Glúteo 4 apoios perna flexionada (Caneleira)", anatomicalAction: "Extensão de quadril com joelho fletido" },
  ],
  Panturrilhas: [
    { name: "Panturrilha em pé (Máquina)", anatomicalAction: "Flexão plantar (Gastrocnêmio)" },
    { name: "Panturrilha (Hack Squat)", anatomicalAction: "Flexão plantar com suporte nos ombros" },
    { name: "Panturrilha (Pressão de pernas 45° linear)", anatomicalAction: "Flexão plantar com joelhos estendidos" },
    { name: "Panturrilha (Pressão de pernas 45° articulado)", anatomicalAction: "Flexão plantar com joelhos estendidos e curva de torque variável" },
    { name: "Panturrilha (Pressão de pernas horizontal)", anatomicalAction: "Flexão plantar com joelhos estendidos sentada" },
    { name: "Panturrilha sentada (Máquina)", anatomicalAction: "Flexão plantar com joelhos flexionados (Foco Sóleo)" },
    { name: "Panturrilha sentado no banco livre (Anilhas)", anatomicalAction: "Flexão plantar com joelhos flexionados" },
  ],
  Core: [
    { name: "Abdominal supra no solo (Livre)", anatomicalAction: "Flexão da coluna vertebral" },
    { name: "Abdominal infra no suporte", anatomicalAction: "Flexão de quadril e retroversão pélvica" },
    { name: "Abdominal infra no banco declinado", anatomicalAction: "Flexão de quadril e retroversão pélvica" },
    { name: "Abdominal (Máquina)", anatomicalAction: "Flexão de tronco com sobrecarga guiada" },
    { name: "Abdominal (Polia)", anatomicalAction: "Flexão de tronco com sobrecarga em cabo" },
    { name: "Abdominal (Crossover)", anatomicalAction: "Flexão de tronco com resistência de cabo" },
    { name: "Abdominal (Crossover angular)", anatomicalAction: "Flexão de tronco com resistência ajustada" },
    { name: "Rotação de tronco woodchopper (Crossover)", anatomicalAction: "Rotação de tronco com resistência" },
    { name: "Rotação de tronco (Crossover angular)", anatomicalAction: "Rotação de tronco em múltiplos vetores" },
    { name: "Prancha frontal no solo (Livre)", anatomicalAction: "Contração isométrica de core (anti-extensão)" },
    { name: "Prancha lateral no solo (Livre)", anatomicalAction: "Contração isométrica de core (anti-flexão lateral)" },
    { name: "Hiperextensão lombar (Suporte)", anatomicalAction: "Extensão de tronco e quadril" },
  ],
  Cardio: [],
  Alongamento: [],
  Aquecimento: [],
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const STEPS = [
  { num: 1, label: "Cadastro",     icon: User },
  { num: 2, label: "Treino",       icon: Dumbbell },
  { num: 3, label: "Periodização", icon: Calendar },
  { num: 4, label: "Resumo",       icon: BarChart3 },
];

const EMPTY_EX = {
  name: "", anatomicalAction: "", muscleGroup: "Peito" as string,
  sets: "", reps: "", intensity: "", rest: "",
};

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [step, setStep]         = useState(1);

  // Step 1
  const [studentName, setStudentName] = useState("");
  const [studentSex, setStudentSex]   = useState("");
  const [trainingDays, setTrainingDays] = useState<string[]>([]);

  // Step 2 — exercises keyed by training day
  const [dayExercises, setDayExercises] = useState<Record<string, Exercise[]>>({});
  const [activeDay, setActiveDay]       = useState<string>("");

  // Modal
  const [modalOpen, setModalOpen]   = useState(false);
  const [modalTab, setModalTab]     = useState<"library" | "custom">("library");
  const [libFilter, setLibFilter]   = useState<string>("Todos");
  const [libSearch, setLibSearch]   = useState("");
  const [newEx, setNewEx]           = useState(EMPTY_EX);
  const [editingId, setEditingId]   = useState<string | null>(null);

  // Step 3
  const [periodization, setPeriodization] = useState({
    week1: { sets: "", reps: "", interval: "", obs: "" },
    week2: { sets: "", reps: "", interval: "", obs: "" },
    week3: { sets: "", reps: "", interval: "", obs: "" },
    week4: { sets: "", reps: "", interval: "", obs: "" },
  });
  const ORDINALS = ["1ª", "2ª", "3ª", "4ª"];
  const formatWeek = (w: { sets: string; reps: string; interval: string; obs: string }, i: number) => {
    const s = w.sets.trim(), r = w.reps.trim(), iv = w.interval.trim(), ob = w.obs.trim();
    if (!s && !r && !iv && !ob) return "";
    let line = `${ORDINALS[i]} SEMANA – EXECUTAR ${s.padStart(2,"0")}X${r.padStart(2,"0")} – ${iv}" DE INTERVALO`;
    if (ob) line += `. ${ob}`;
    return line;
  };

  // ── Google Sheets config ──────────────────────────────────────────────────
  const [configOpen, setConfigOpen]       = useState(false);
  const [clientId, setClientId]           = useState(() => localStorage.getItem("prodigy_client_id") ?? "");
  const [spreadsheetId, setSpreadsheetId] = useState(() => localStorage.getItem("prodigy_sheet_id") ?? "1S24821JDPKc3CYc3d-OKdql5YHmecFOojzpKLl8uyFo");
  const [clientIdDraft, setClientIdDraft] = useState(clientId);
  const [sheetIdDraft, setSheetIdDraft]   = useState(spreadsheetId);

  // ── Google Sheets state ───────────────────────────────────────────────────
  const [accessToken, setAccessToken]     = useState<string | null>(null);
  const [saveStatus, setSaveStatus]       = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [exporting, setExporting]         = useState(false);
  const tokenClientRef                    = useRef<{ requestAccessToken: () => void } | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Load Google Identity Services script once
  useEffect(() => {
    const existing = document.getElementById("gis-script");
    if (existing) return;
    const script  = document.createElement("script");
    script.id     = "gis-script";
    script.src    = "https://accounts.google.com/gsi/client";
    script.async  = true;
    document.body.appendChild(script);
  }, []);

  // Set default active day when entering step 2
  useEffect(() => {
    if (step === 2 && trainingDays.length > 0) {
      if (!activeDay || !trainingDays.includes(activeDay)) {
        setActiveDay(trainingDays[0]);
      }
    }
  }, [step, trainingDays]);

  const toggleDay = (day: string) => {
    setTrainingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // ── All exercises flattened from every day ────────────────────────────────

  const allExercises = useMemo(
    () =>
      trainingDays.flatMap((day) =>
        (dayExercises[day] ?? []).map((e) => ({ ...e, day }))
      ),
    [dayExercises, trainingDays]
  );

  // ── Exercises already used across all days (for "reuse" section) ──────────

  const usedExercises = useMemo(() => {
    const seen = new Map<string, Exercise & { day: string }>();
    trainingDays.forEach((day) => {
      (dayExercises[day] ?? []).forEach((e) => {
        if (!seen.has(e.name.toLowerCase())) seen.set(e.name.toLowerCase(), { ...e, day });
      });
    });
    return Array.from(seen.values());
  }, [dayExercises, trainingDays]);

  // ── Library items filtered ────────────────────────────────────────────────

  const filteredLibrary = useMemo(() => {
    const groups = libFilter === "Todos" ? MUSCLE_GROUPS : [libFilter as MuscleGroup];
    const q = libSearch.trim().toLowerCase();
    return groups.flatMap((g) => {
      const list = LIBRARY[g] || [];
      return list
        .filter((ex) => !q || ex.name.toLowerCase().includes(q) || ex.anatomicalAction.toLowerCase().includes(q))
        .map((ex) => ({ ...ex, muscleGroup: g }));
    });
  }, [libFilter, libSearch]);

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingId(null);
    setNewEx(EMPTY_EX);
    setModalTab("library");
    setLibFilter("Todos");
    setLibSearch("");
    setModalOpen(true);
  };

  const openEditModal = (ex: Exercise) => {
    setEditingId(ex.id);
    setNewEx({
      name: ex.name, anatomicalAction: ex.anatomicalAction, muscleGroup: ex.muscleGroup,
      sets: ex.sets, reps: ex.reps, intensity: ex.intensity, rest: ex.rest,
    });
    setModalTab("custom");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setNewEx(EMPTY_EX);
  };

  const addFromLibrary = (item: { name: string; anatomicalAction: string; muscleGroup: string }) => {
    const id = Math.random().toString(36).slice(2, 10);
    setDayExercises((prev) => ({
      ...prev,
      [activeDay]: [...(prev[activeDay] ?? []), { id, ...item, sets: "", reps: "", intensity: "", rest: "" }],
    }));
    closeModal();
  };

  const handleSaveCustom = () => {
    if (!newEx.name.trim()) return;
    if (editingId) {
      setDayExercises((prev) => {
        const updated = { ...prev };
        trainingDays.forEach((day) => {
          updated[day] = (updated[day] ?? []).map((e) =>
            e.id === editingId ? { ...e, ...newEx } : e
          );
        });
        return updated;
      });
    } else {
      const id = Math.random().toString(36).slice(2, 10);
      setDayExercises((prev) => ({
        ...prev,
        [activeDay]: [...(prev[activeDay] ?? []), { id, ...newEx }],
      }));
    }
    closeModal();
  };

  const removeExercise = (day: string, id: string) => {
    setDayExercises((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).filter((e) => e.id !== id),
    }));
  };

  const toggleExerciseFlag = (day: string, id: string, flag: "gray" | "asterisk") => {
    setDayExercises((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).map((e) => e.id === id ? { ...e, [flag]: !e[flag] } : e),
    }));
  };

  // ── Save config ──────────────────────────────────────────────────────────
  const saveConfig = () => {
    localStorage.setItem("prodigy_client_id", clientIdDraft.trim());
    localStorage.setItem("prodigy_sheet_id", sheetIdDraft.trim());
    setClientId(clientIdDraft.trim());
    setSpreadsheetId(sheetIdDraft.trim());
    setConfigOpen(false);
  };

  // ── Build rows for the sheet ──────────────────────────────────────────────
  const buildSheetRows = (): string[][] => {
    const rows: string[][] = [];
    rows.push(["PRODIGY — Ficha de Treino", "", "", "", "", "", ""]);
    rows.push([]);
    rows.push(["Aluno:", studentName, "", "Sexo:", studentSex, "", ""]);
    rows.push(["Frequência:", `${trainingDays.length}× por semana`, "", "Dias:", trainingDays.join(", "), "", ""]);
    rows.push([]);
    rows.push(["Dia", "Grupo Muscular", "Ação Anatômica / Exercício", "Séries", "Repetições", "Intensidade", "Descanso"]);

    trainingDays.forEach((day) => {
      const exs = dayExercises[day] ?? [];
      if (exs.length === 0) return;
      exs.forEach((ex, i) => {
        rows.push([
          i === 0 ? day : "",
          ex.muscleGroup,
          ex.anatomicalAction ? `${ex.name} — ${ex.anatomicalAction}` : ex.name,
          ex.sets  || "",
          ex.reps  || "",
          ex.intensity || "",
          ex.rest  || "",
        ]);
      });
      rows.push([]);
    });

    const hasPerio = (["week1", "week2", "week3", "week4"] as const).some((w) => formatWeek(periodization[w], 0).length > 0 || periodization[w].sets || periodization[w].reps || periodization[w].interval);
    if (hasPerio) {
      rows.push(["PERIODIZAÇÃO", "", "", "", "", "", ""]);
      (["week1", "week2", "week3", "week4"] as const).forEach((week, i) => {
        const label = formatWeek(periodization[week], i);
        if (label) rows.push([label, "", "", "", "", "", ""]);
      });
    }
    return rows;
  };

  // ── Write rows to Sheets and then enable PDF ──────────────────────────────
  const writeToSheet = async (token: string) => {
    setSaveStatus("saving");
    try {
      const sheetId = spreadsheetId.trim();
      const base    = "https://sheets.googleapis.com/v4/spreadsheets";
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      const DAY_COLS = [
        { name: "B", action: "B", series: "D", reps: "D" },
        { name: "F", action: "F", series: "G", reps: "G" },
        { name: "I", action: "I", series: "J", reps: "J" },
      ];
      const START_ROW   = 10;
      const ROWS_PER_EX = 4;
      const MAX_DAYS    = 3;
      const MAX_EX      = 10;

      const data: { range: string; values: string[][] }[] = [];

      data.push({ range: "B3", values: [[studentName.toUpperCase()]] });
      data.push({ range: "H3", values: [[studentSex === "Masculino" ? "M" : "F"]] });

      const DAY_COL_RANGES = [
        { startCol: 1, endCol: 4 },  // B–D
        { startCol: 5, endCol: 7 },  // F–G
        { startCol: 8, endCol: 10 }, // I–J
      ];
      const formatRequests: object[] = [];

      trainingDays.slice(0, MAX_DAYS).forEach((day, dayIdx) => {
        const cols = DAY_COLS[dayIdx];
        const exs  = (dayExercises[day] ?? []).slice(0, MAX_EX);

        exs.forEach((ex, exIdx) => {
          const nameRow   = START_ROW + exIdx * ROWS_PER_EX;
          const actionRow = nameRow + 2;

          data.push({ range: `${cols.name}${nameRow}`,     values: [[ex.name]] });
          data.push({ range: `${cols.action}${actionRow}`, values: [[ex.anatomicalAction]] });
          data.push({ range: `${cols.series}${nameRow}`,   values: [[ex.asterisk ? "*" : ex.sets]] });
          data.push({ range: `${cols.reps}${actionRow}`,   values: [[ex.reps]] });

          if (ex.gray) {
            const cr = DAY_COL_RANGES[dayIdx];
            formatRequests.push({
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: nameRow - 1,
                  endRowIndex:   nameRow + 3,
                  startColumnIndex: cr.startCol,
                  endColumnIndex:   cr.endCol,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.714, green: 0.714, blue: 0.714 },
                  },
                },
                fields: "userEnteredFormat.backgroundColor",
              },
            });
          }
        });
      });

      (["week1", "week2", "week3", "week4"] as const).forEach((week, i) => {
        const label = formatWeek(periodization[week], i);
        if (label) data.push({ range: `A${54 + i}`, values: [[label]] });
      });

      await fetch(`${base}/${sheetId}/values:batchClear`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ranges: ["B3", "H3", "B10:D49", "F10:G49", "I10:J49", "A54:A57"],
        }),
      });

      await fetch(`${base}/${sheetId}/values:batchUpdate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ valueInputOption: "RAW", data }),
      });

      const resetRanges = [
        { startCol: 1, endCol: 4 },  // B–D
        { startCol: 5, endCol: 7 },  // F–G
        { startCol: 8, endCol: 10 }, // I–J
      ].map((cr) => ({
        repeatCell: {
          range: { sheetId: 0, startRowIndex: 9, endRowIndex: 49, startColumnIndex: cr.startCol, endColumnIndex: cr.endCol },
          cell: { userEnteredFormat: { backgroundColor: { red: 1, green: 1, blue: 1 } } },
          fields: "userEnteredFormat.backgroundColor",
        },
      }));

      await fetch(`${base}/${sheetId}:batchUpdate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ requests: [...resetRanges, ...formatRequests] }),
      });

      setAccessToken(token);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  // ── Trigger OAuth and save ────────────────────────────────────────────────
  const handleSaveProgram = () => {
    if (!clientId || !spreadsheetId) { setConfigOpen(true); return; }

    if (!tokenClientRef.current) {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: [
          "https://www.googleapis.com/auth/spreadsheets",
          "https://www.googleapis.com/auth/drive.readonly",
        ].join(" "),
        callback: (res) => {
          if (res.error) { setSaveStatus("error"); return; }
          writeToSheet(res.access_token);
        },
      });
    }
    tokenClientRef.current.requestAccessToken();
  };

  // ── Export PDF via Drive API ──────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!accessToken || !spreadsheetId) return;
    setExporting(true);
    try {
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=pdf&size=A4&portrait=true&scale=1&fitw=false&gridlines=false&printtitle=false&sheetnames=false&top_margin=0.5&bottom_margin=0.5&left_margin=0.6&right_margin=0.2&hc=true`;
      const res  = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const a    = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      a.download = `${studentName || "treino"}_prodigy.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setSaveStatus("error");
    } finally {
      setExporting(false);
    }
  };

  const canGoNext = () => {
    if (step === 1)
      return studentName.trim() !== "" && studentSex !== "" && trainingDays.length > 0;
    return true;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span
              className="text-base font-bold tracking-widest uppercase"
              style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: "0.2em" }}
            >
              PRODIGY
            </span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-1 tracking-wide">
              Personal Training System
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setClientIdDraft(clientId); setSheetIdDraft(spreadsheetId); setConfigOpen(true); }}
              className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Configurações Google Sheets"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ── Step Indicator ────────────────────────────────────── */}
        <div className="mb-12">
          <div className="relative flex items-start justify-between">
            <div className="absolute top-4 left-0 right-0 h-px bg-border" />
            <div
              className="absolute top-4 left-0 h-px bg-primary transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isDone   = step > s.num;
              const isActive = step === s.num;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isDone   ? "bg-primary border-primary text-white" :
                    isActive ? "bg-card border-primary text-primary shadow-md shadow-primary/20" :
                               "bg-card border-border text-muted-foreground"
                  }`}>
                    {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span
                    className={`text-[10px] font-medium tracking-widest uppercase transition-colors ${
                      isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                    }`}
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STEP 1 — Cadastro ─────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-10">
            <div>
              <p className="text-xs tracking-widest text-primary uppercase mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                Etapa 01 / Cadastro
              </p>
              <h1 className="text-3xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Dados do Aluno
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Preencha as informações básicas e selecione os dias de treino.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome completo</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sexo biológico</label>
                <div className="flex gap-3">
                  {["Masculino", "Feminino"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStudentSex(s)}
                      className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-all ${
                        studentSex === s
                          ? "bg-primary border-primary text-white shadow-sm shadow-primary/30"
                          : "bg-input-background border-border hover:border-primary/40"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Dias de treino</label>
                {trainingDays.length > 0 && (
                  <span className="text-xs text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {trainingDays.length}× / semana
                  </span>
                )}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_SHORT.map((day) => {
                  const sel = trainingDays.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`flex flex-col items-center gap-2 py-4 rounded-xl border text-xs font-medium transition-all ${
                        sel
                          ? "bg-primary border-primary text-white shadow-sm shadow-primary/30"
                          : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <span style={{ fontFamily: "'DM Mono', monospace" }}>{day}</span>
                      <div className={`w-1.5 h-1.5 rounded-full transition-all ${sel ? "bg-white/70" : "bg-border"}`} />
                    </button>
                  );
                })}
              </div>
              {trainingDays.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {trainingDays.map((d) => (
                    <span key={d} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs border border-primary/20" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2 — Treino ───────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs tracking-widest text-primary uppercase mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                  Etapa 02 / Treino
                </p>
                <h1 className="text-3xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Programação de Exercícios
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Selecione o dia e adicione exercícios ao treino.
                </p>
              </div>
              <button
                onClick={openAddModal}
                className="flex-shrink-0 flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Adicionar Exercício</span>
                <span className="sm:hidden">Adicionar</span>
              </button>
            </div>

            {/* Day tabs — built from selected training days */}
            <div className="flex gap-1 p-1 bg-muted rounded-xl overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {trainingDays.map((day) => {
                const count = (dayExercises[day] ?? []).length;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`flex items-center gap-2 flex-shrink-0 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeDay === day
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span style={{ fontFamily: "'DM Mono', monospace" }}>{day}</span>
                    {count > 0 && (
                      <span className="text-[10px] text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Exercise list for active day */}
            <div className="space-y-3 min-h-[300px]">
              {(dayExercises[activeDay] ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-border">
                  <Dumbbell className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Nenhum exercício para{" "}
                    <span className="text-foreground font-medium">{activeDay}</span>
                  </p>
                  <button
                    onClick={openAddModal}
                    className="mt-3 flex items-center gap-1.5 text-primary text-sm hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar agora
                  </button>
                </div>
              ) : (
                <>
                  <div className="hidden md:grid gap-3 px-4 py-2" style={{ gridTemplateColumns: "2rem 1fr auto 5rem 5rem 6rem 5rem 2rem" }}>
                    {["#", "Exercício / Ação", "", "Séries", "Reps", "Intensidade", "Descanso", ""].map((h) => (
                      <span key={h} className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {h}
                      </span>
                    ))}
                  </div>
                  {(dayExercises[activeDay] ?? []).map((ex, i) => (
                    <div
                      key={ex.id}
                      onClick={() => openEditModal(ex)}
                      className={`group flex md:grid items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${ex.gray ? "bg-[#444444] border-[#555555] hover:border-[#666666]" : "bg-card border-border hover:border-primary/25"}`}
                      style={{ gridTemplateColumns: "2rem 1fr auto 5rem 5rem 6rem 5rem 2rem" }}
                    >
                      <span className={`text-xs flex-shrink-0 ${ex.gray ? "text-[#aaaaaa]" : "text-muted-foreground"}`} style={{ fontFamily: "'DM Mono', monospace" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-medium text-sm ${ex.gray ? "text-white" : "text-foreground"}`}>{ex.name}</p>
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] border font-medium ${MUSCLE_COLOR[ex.muscleGroup] ?? "bg-primary/10 text-primary border-primary/20"}`}>
                            {ex.muscleGroup}
                          </span>
                        </div>
                        {ex.anatomicalAction && (
                          <p className={`text-xs mt-0.5 truncate ${ex.gray ? "text-[#aaaaaa]" : "text-muted-foreground"}`}>{ex.anatomicalAction}</p>
                        )}
                      </div>
                      {/* Flag buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          title="Pintar cinza escuro na planilha"
                          onClick={(e) => { e.stopPropagation(); toggleExerciseFlag(activeDay, ex.id, "gray"); }}
                          className={`w-7 h-7 rounded-md border text-xs font-bold flex items-center justify-center transition-all ${ex.gray ? "bg-[#666666] border-[#888888] text-white" : "bg-muted border-border text-muted-foreground hover:border-[#666666] hover:text-[#888888]"}`}
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          ■
                        </button>
                        <button
                          title="Asterisco na célula de séries"
                          onClick={(e) => { e.stopPropagation(); toggleExerciseFlag(activeDay, ex.id, "asterisk"); }}
                          className={`w-7 h-7 rounded-md border text-sm font-bold flex items-center justify-center transition-all ${ex.asterisk ? "bg-primary/20 border-primary text-primary" : "bg-muted border-border text-muted-foreground hover:border-primary/40 hover:text-primary"}`}
                        >
                          *
                        </button>
                      </div>
                      {[ex.sets || "—", ex.reps || "—", ex.intensity || "—", ex.rest || "—"].map((val, vi) => (
                        <span key={vi} className={`hidden md:block text-sm ${ex.gray ? "text-[#cccccc]" : "text-foreground"}`} style={{ fontFamily: "'DM Mono', monospace" }}>
                          {vi === 0 && ex.asterisk ? "*" : val}
                        </span>
                      ))}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeExercise(activeDay, ex.id); }}
                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3 — Periodização ─────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <p className="text-xs tracking-widest text-primary uppercase mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                Etapa 03 / Periodização
              </p>
              <h1 className="text-3xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Plano de Periodização
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Defina as diretrizes e objetivos de carga para cada semana do macrociclo.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {(["week1", "week2", "week3", "week4"] as const).map((week, i) => (
                <div key={week} className="flex flex-col gap-3 p-5 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-primary text-[10px] font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>W{i + 1}</span>
                    </div>
                    <label className="text-sm font-medium">{ORDINALS[i]} Semana</label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Séries</span>
                      <input
                        type="text"
                        value={periodization[week].sets}
                        onChange={(e) => setPeriodization((p) => ({ ...p, [week]: { ...p[week], sets: e.target.value } }))}
                        placeholder="03"
                        className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Repetições</span>
                      <input
                        type="text"
                        value={periodization[week].reps}
                        onChange={(e) => setPeriodization((p) => ({ ...p, [week]: { ...p[week], reps: e.target.value } }))}
                        placeholder="15"
                        className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Intervalo (seg)</span>
                      <input
                        type="text"
                        value={periodization[week].interval}
                        onChange={(e) => setPeriodization((p) => ({ ...p, [week]: { ...p[week], interval: e.target.value } }))}
                        placeholder="50"
                        className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Observação (opcional)</span>
                    <textarea
                      value={periodization[week].obs}
                      onChange={(e) => setPeriodization((p) => ({ ...p, [week]: { ...p[week], obs: e.target.value } }))}
                      placeholder="Ex: ONDE TEM (*) FAZER 4 REPS + DESCANSO DE 15&quot; + FAZER 4 REPS..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none transition-all leading-relaxed"
                    />
                  </div>
                  {formatWeek(periodization[week], i) && (
                    <p className="text-[11px] text-primary font-medium mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {formatWeek(periodization[week], i)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4 — Resumo ───────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-widest text-primary uppercase mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                  Etapa 04 / Resumo
                </p>
                <h1 className="text-3xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Ficha de Treino
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Programa completo de{" "}
                  <span className="text-foreground font-medium">{studentName || "Aluno"}</span>
                  {studentSex && <span className="text-muted-foreground"> · {studentSex}</span>}
                </p>
              </div>
              <button
                onClick={handleExportPDF}
                disabled={saveStatus !== "saved" || exporting}
                className="flex-shrink-0 flex items-center gap-2 h-10 px-4 rounded-xl border border-border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-muted enabled:text-foreground text-muted-foreground"
                title={saveStatus !== "saved" ? "Salve o programa primeiro" : "Baixar PDF"}
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                <span className="hidden sm:inline">{exporting ? "Gerando…" : "Exportar PDF"}</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Aluno",           val: studentName || "—" },
                { label: "Frequência",      val: trainingDays.length > 0 ? `${trainingDays.length}× / semana` : "—" },
                { label: "Total Exercícios",val: String(allExercises.length) },
              ].map(({ label, val }) => (
                <div key={label} className="p-5 rounded-2xl bg-card border border-border">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>{label}</p>
                  <p className="text-xl font-semibold truncate" style={{ fontFamily: "'Outfit', sans-serif" }}>{val}</p>
                </div>
              ))}
            </div>

            {/* Day chips */}
            {trainingDays.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {trainingDays.map((d) => (
                  <span key={d} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs border border-primary/20 font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {d} · {(dayExercises[d] ?? []).length} exercícios
                  </span>
                ))}
              </div>
            )}

            {/* Table — grouped by day */}
            {allExercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed border-border">
                <ClipboardList className="w-8 h-8 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">Nenhum exercício cadastrado.</p>
                <button onClick={() => setStep(2)} className="mt-2 text-primary text-sm hover:underline">
                  Ir para Treino
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        {["Dia", "#", "Grupo", "Ação Anatômica / Exercício", "Séries", "Reps", "Intensidade", "Descanso"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap" style={{ fontFamily: "'DM Mono', monospace" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trainingDays.map((day) => {
                        const exs = dayExercises[day] ?? [];
                        return exs.map((ex, i) => (
                          <tr key={ex.id} className={`border-b border-border last:border-0 bg-card hover:bg-muted/40 transition-colors ${i === 0 ? "border-t-2 border-t-border" : ""}`}>
                            {i === 0 ? (
                              <td
                                className="px-4 py-3.5 align-top"
                                rowSpan={exs.length}
                              >
                                <span className="inline-flex px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs border border-primary/20 font-medium whitespace-nowrap" style={{ fontFamily: "'DM Mono', monospace" }}>
                                  {day}
                                </span>
                              </td>
                            ) : null}
                            <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap" style={{ fontFamily: "'DM Mono', monospace" }}>
                              {String(i + 1).padStart(2, "0")}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] border font-medium ${MUSCLE_COLOR[ex.muscleGroup] ?? "bg-primary/10 text-primary border-primary/20"}`}>
                                {ex.muscleGroup}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 min-w-[200px]">
                              <p className="font-medium text-foreground">{ex.name}</p>
                              {ex.anatomicalAction && (
                                <p className="text-xs text-muted-foreground mt-0.5">{ex.anatomicalAction}</p>
                              )}
                            </td>
                            {[ex.sets, ex.reps, ex.intensity, ex.rest].map((val, vi) => (
                              <td key={vi} className="px-4 py-3.5 text-foreground whitespace-nowrap" style={{ fontFamily: "'DM Mono', monospace" }}>
                                {val || <span className="text-muted-foreground/40">—</span>}
                              </td>
                            ))}
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Periodization */}
            {(["week1", "week2", "week3", "week4"] as const).some((w, i) => !!formatWeek(periodization[w], i)) && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>Periodização</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["week1", "week2", "week3", "week4"] as const).map((week, i) => {
                    const label = formatWeek(periodization[week], i);
                    return label ? (
                      <div key={week} className="p-5 rounded-2xl bg-card border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <span className="text-primary text-[9px] font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>W{i + 1}</span>
                          </div>
                          <p className="text-[10px] font-medium uppercase tracking-widest text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>
                            {ORDINALS[i]} Semana
                          </p>
                        </div>
                        <p className="text-sm text-foreground font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>{label}</p>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Save status feedback */}
            {saveStatus === "saved" && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Programa salvo na planilha com sucesso! Agora você pode exportar o PDF.</span>
              </div>
            )}
            {saveStatus === "error" && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Erro ao salvar. Verifique as credenciais nas configurações e tente novamente.</span>
              </div>
            )}
            <button
              onClick={handleSaveProgram}
              disabled={saveStatus === "saving"}
              className="w-full h-12 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saveStatus === "saving" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando na planilha…</>
              ) : saveStatus === "saved" ? (
                <><CheckCircle2 className="w-4 h-4" /> Salvo — salvar novamente</>
              ) : (
                "Salvar Programa"
              )}
            </button>

            {(!clientId || !spreadsheetId) && (
              <p className="text-center text-xs text-muted-foreground">
                Configure suas credenciais do Google clicando em{" "}
                <button onClick={() => setConfigOpen(true)} className="text-primary underline">
                  Configurações
                </button>{" "}
                antes de salvar.
              </p>
            )}
          </div>
        )}

        {/* ── Navigation ────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 h-10 px-5 rounded-xl border border-border text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <span className="text-xs text-muted-foreground hidden sm:block" style={{ fontFamily: "'DM Mono', monospace" }}>
            {step} / {STEPS.length}
          </span>
          {step < 4 ? (
            <button
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={!canGoNext()}
              className="flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : <div className="w-24" />}
        </div>
      </div>

      {/* ── Config Modal (Google Sheets credentials) ──────────────── */}
      <Dialog.Root open={configOpen} onOpenChange={setConfigOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-7">
            <div className="flex items-start justify-between mb-6">
              <div>
                <Dialog.Title className="text-xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Configurar Google Sheets
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground mt-1">
                  Credenciais OAuth 2.0 do Google Cloud Console
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Client ID (OAuth 2.0)</label>
                <input
                  type="text"
                  placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"
                  value={clientIdDraft}
                  onChange={(e) => setClientIdDraft(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                />
                <p className="text-xs text-muted-foreground">
                  Encontre em Google Cloud Console → APIs & Services → Credentials
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">ID da Planilha</label>
                <input
                  type="text"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                  value={sheetIdDraft}
                  onChange={(e) => setSheetIdDraft(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                />
                <p className="text-xs text-muted-foreground">
                  Está na URL: docs.google.com/spreadsheets/d/<span className="text-primary font-medium">ID</span>/edit
                </p>
              </div>

              {/* Help link */}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Abrir Google Cloud Console
              </a>

              <div className="p-3.5 rounded-xl bg-muted border border-border text-xs text-muted-foreground leading-relaxed space-y-1">
                <p className="font-medium text-foreground">Pré-requisitos no Google Cloud:</p>
                <p>• Habilitar <span className="text-foreground">Google Sheets API</span> e <span className="text-foreground">Google Drive API</span></p>
                <p>• Adicionar <span className="text-foreground">http://localhost:5173</span> (ou sua URL) como <em>Authorized JavaScript Origin</em></p>
                <p>• Tipo de aplicativo: <span className="text-foreground">Web application</span></p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Dialog.Close asChild>
                <button className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                onClick={saveConfig}
                disabled={!clientIdDraft.trim() || !sheetIdDraft.trim()}
                className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Salvar configurações
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Exercise Modal ────────────────────────────────────────── */}
      <Dialog.Root open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col"
            style={{ maxHeight: "88vh" }}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-border flex-shrink-0">
              <div>
                <Dialog.Title className="text-xl font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {editingId ? "Editar Exercício" : "Adicionar Exercício"}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground mt-1">
                  Dia:{" "}
                  <span className="text-primary font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {activeDay}
                  </span>
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Tabs */}
            {!editingId && (
              <div className="flex gap-1 px-7 pt-4 flex-shrink-0">
                {(["library", "custom"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setModalTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      modalTab === tab
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {tab === "library" ? "Selecionar da biblioteca" : "Criar novo"}
                  </button>
                ))}
              </div>
            )}

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-7 py-5" style={{ scrollbarWidth: "thin" }}>

              {/* ── Library tab ── */}
              {modalTab === "library" && !editingId && (
                <div className="space-y-5">

                  {/* Already used exercises (from other days) */}
                  {usedExercises.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                        Já cadastrados
                      </p>
                      <div className="space-y-2">
                        {usedExercises.map((ex) => (
                          <button
                            key={ex.id}
                            onClick={() => addFromLibrary({ name: ex.name, anatomicalAction: ex.anatomicalAction, muscleGroup: ex.muscleGroup })}
                            className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/60 border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{ex.name}</p>
                              {ex.anatomicalAction && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{ex.anatomicalAction}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] border font-medium ${MUSCLE_COLOR[ex.muscleGroup] ?? "bg-primary/10 text-primary border-primary/20"}`}>
                                {ex.muscleGroup}
                              </span>
                              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-3 h-3 text-primary" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Library search + filter */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                      Biblioteca de exercícios
                    </p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Buscar exercício..."
                        value={libSearch}
                        onChange={(e) => setLibSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {["Todos", ...MUSCLE_GROUPS].map((g) => (
                        <button
                          key={g}
                          onClick={() => setLibFilter(g)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            libFilter === g
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Library results */}
                  <div className="space-y-2">
                    {filteredLibrary.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhum exercício encontrado.</p>
                    ) : (
                      filteredLibrary.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => addFromLibrary(item)}
                          className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/40 border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{item.anatomicalAction}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] border font-medium ${MUSCLE_COLOR[item.muscleGroup] ?? "bg-primary/10 text-primary border-primary/20"}`}>
                              {item.muscleGroup}
                            </span>
                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus className="w-3 h-3 text-primary" />
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => setModalTab("custom")}
                    className="w-full h-10 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Criar exercício personalizado
                  </button>
                </div>
              )}

              {/* ── Custom tab ── */}
              {(modalTab === "custom" || editingId) && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Nome do exercício <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Supino reto com barra"
                      value={newEx.name}
                      onChange={(e) => setNewEx((p) => ({ ...p, name: e.target.value }))}
                      autoFocus
                      className="w-full h-11 px-4 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Ação anatômica</label>
                    <input
                      type="text"
                      placeholder="Ex: Adução horizontal do ombro"
                      value={newEx.anatomicalAction}
                      onChange={(e) => setNewEx((p) => ({ ...p, anatomicalAction: e.target.value }))}
                      className="w-full h-11 px-4 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Grupo muscular</label>
                    <div className="flex flex-wrap gap-2">
                      {MUSCLE_GROUPS.map((g) => (
                        <button
                          key={g}
                          onClick={() => setNewEx((p) => ({ ...p, muscleGroup: g }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            newEx.muscleGroup === g
                              ? `${MUSCLE_COLOR[g]} shadow-sm`
                              : "bg-muted text-muted-foreground border-border hover:text-foreground"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "sets",      label: "Séries",     ph: "Ex: 4" },
                      { key: "reps",      label: "Repetições", ph: "Ex: 8–12" },
                      { key: "intensity", label: "Intensidade",ph: "Ex: 70% 1RM" },
                      { key: "rest",      label: "Descanso",   ph: "Ex: 90s" },
                    ].map(({ key, label, ph }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-sm font-medium">{label}</label>
                        <input
                          type="text"
                          placeholder={ph}
                          value={newEx[key as keyof typeof newEx]}
                          onChange={(e) => setNewEx((p) => ({ ...p, [key]: e.target.value }))}
                          className="w-full h-11 px-4 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            {(modalTab === "custom" || editingId) && (
              <div className="flex gap-3 px-7 py-5 border-t border-border flex-shrink-0">
                {!editingId && (
                  <button
                    onClick={() => setModalTab("library")}
                    className="h-11 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    ← Biblioteca
                  </button>
                )}
                <Dialog.Close asChild>
                  <button className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleSaveCustom}
                  disabled={!newEx.name.trim()}
                  className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                >
                  {editingId ? "Salvar" : "Adicionar"}
                </button>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}