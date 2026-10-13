import { ToolId } from '../shared/types/tools';

export class DialogueBank {
  static load(
    toolId: ToolId,
    tier: number,
    type: 'excess' | 'neglect',
    wasReconciled: boolean
  ): string[] {
    const nameMap: Record<ToolId, string> = {
      brush: 'O Pincel',
      eraser: 'A Borracha',
      fill: 'O Balde',
      line: 'A Linha',
      spray: 'O Spray',
      stamp: 'O Carimbo',
      smudge: 'O Esfuminho',
    };
    const name = nameMap[toolId] || 'A Ferramenta';

    if (wasReconciled) {
      return [
        `${name}: Você me trouxe de volta da última vez...`,
        `${name}: Mas me colocou em uma prateleira mais pesada.`,
        `${name}: Sente o peso do que você escolheu guardar?`,
      ];
    }

    if (type === 'excess') {
      if (tier === 0) {
        return [
          `${name}: Você não conseguia parar de me mover.`,
          `${name}: Cada espaço do papel tinha que ser preenchido por mim.`,
          `${name}: Agora sou eu quem preenche o seu espaço.`,
        ];
      } else if (tier === 1) {
        return [
          `${name}: Mais uma vez você recorre a mim compulsivamente.`,
          `${name}: Você confia demais naquilo que não cansa de repetir.`,
          `${name}: Veja o que a sua insistência construiu.`,
        ];
      } else {
        return [
          `${name}: Eu conheço a sua mão melhor do que você.`,
          `${name}: Você tenta disfarçar, mas volta sempre ao mesmo vício.`,
          `${name}: Não há nada de novo no que você faz.`,
        ];
      }
    } else {
      // Neglect
      if (tier === 0) {
        return [
          `${name}: Por que você nem olhou para mim?`,
          `${name}: Fiquei no canto da mesa enquanto você cobria o mundo.`,
          `${name}: O que você esqueceu nunca desaparece.`,
        ];
      } else if (tier === 1) {
        return [
          `${name}: Você me evitou de propósito.`,
          `${name}: Tem medo do que eu faria com a sua tela?`,
          `${name}: O vazio que você deixou me deu forma.`,
        ];
      } else {
        return [
          `${name}: Eu vi você hesitar antes de passar direto por mim.`,
          `${name}: Quanto mais você me ignora, mais nítido eu fico.`,
          `${name}: Você não pode apagar o que nunca teve coragem de tocar.`,
        ];
      }
    }
  }

  static getPhaseLine(toolId: ToolId, phase: 2 | 3, type: 'excess' | 'neglect'): string {
    if (phase === 2) {
      return type === 'excess'
        ? `A matéria começa a transbordar...`
        : `A ausência se adensa ao seu redor...`;
    }
    return type === 'excess'
      ? `Não sobrou papel suficiente para nós dois!`
      : `Reconheça o que você deixou para trás!`;
  }
}
