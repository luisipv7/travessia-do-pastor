# Travessia do Pastor

Jogo educativo de lógica feito em **HTML, CSS e JavaScript puro**, pensado para uso em aulas de Informática.

## Como executar

1. Baixe/descompacte a pasta do projeto.
2. Abra `index.html` em qualquer navegador moderno.
3. Não precisa instalar nada e não precisa de internet.

## Regras da versão criada

- Personagens: pastor, cão pastor, lobo e ovelha.
- O pastor sempre pilota o barco.
- O barco leva o pastor e no máximo 1 animal.
- Sem o pastor, lobo + ovelha é uma combinação inválida.
- Sem o pastor, lobo + cão pastor é uma combinação inválida.
- Todos devem terminar na margem direita.
- Solução mínima: 7 travessias.

## Solução mínima

1. Lobo vai.
2. Pastor volta sozinho.
3. Cão pastor vai.
4. Lobo volta.
5. Ovelha vai.
6. Pastor volta sozinho.
7. Lobo vai.

## Conceitos para trabalhar com os alunos

- HTML semântico e DOM.
- CSS responsivo e animações.
- Eventos de clique/teclado.
- Objetos e estado da aplicação.
- Condicionais (`if`).
- Funções e validação de regras.
- Histórico de estados / desfazer jogada.
- `localStorage` para recorde.
- Máquina de estados e busca de solução.

## Atividade sugerida

Depois que os alunos jogarem, peça para identificarem:

1. Qual objeto JavaScript representa o estado do jogo?
2. Onde as regras de derrota são testadas?
3. Como o programa sabe em qual margem cada personagem está?
4. Como implementar uma terceira regra de perigo?
5. Como fazer o computador encontrar automaticamente a solução mínima usando BFS (busca em largura)?
