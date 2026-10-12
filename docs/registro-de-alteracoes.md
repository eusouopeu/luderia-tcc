# Registro de alterações

Mudanças relevantes no TCC e na pasta do projeto: metodologia, arquivos, instruções, capítulos, site de apresentação, app de coleta de observação, scripts de extração etc. Registros em ordem cronológica, do mais antigo para o mais recente.

Formato de uma mudança:

```
## AAAA/MM/DD

### HH:mm
**Objeto**: caminho ou nome do objeto da mudança
**Antes**: o que havia na versão anterior
**Depois**: o que passou a haver na versão nova
**Justificativa**: razão da mudança
```

Formato de uma divergência encontrada entre documentos (data em que foi encontrada):

```
### HH:mm
**Objeto**: arquivos ou trechos em divergência
**Antes**: o que diz o arquivo mais antigo
**Depois**: o que diz o arquivo mais recente
**Efeitos colaterais**: prejuízos que a versão mais recente pode causar ao trabalho, se houver
```

---

## 2026/10/12

### 10:22
**Objeto**: `docs/registro-de-alteracoes.md`
**Antes**: arquivo inexistente; as mudanças ficavam registradas só nas mensagens de commit.
**Depois**: registro cronológico de mudanças e divergências, com objeto, antes, depois e justificativa (ou efeitos colaterais).
**Justificativa**: pedido do autor, para rastrear em um só lugar as mudanças relevantes do trabalho.

### 10:22
**Objeto**: `CLAUDE.md`, nova seção "Registro de alterações"
**Antes**: sem regra de registro de mudanças fora do commit.
**Depois**: duas regras obrigatórias: (1) registrar toda mudança em arquivo da pasta; (2) registrar toda divergência entre documentos ainda sem registro, com seus efeitos colaterais.
**Justificativa**: pedido do autor, para que o registro seja mantido em todas as sessões.

### 10:22
**Objeto**: `CLAUDE.md` (seções "Princípios e preferências", "1.1" e "4") × pasta `_instrucoes/`
**Antes**: a tabela "Mapa dos arquivos de instrução" do `CLAUDE.md` aponta para `_instrucoes/4_metodologia.md`, `_instrucoes/8_financeiro.md` e `_instrucoes/10_biblio-apendices.md`, que existem.
**Depois**: outras partes do mesmo `CLAUDE.md` ainda citam `instrucoes/metodologia.md`, `instrucoes/financeiro.md` e `instrucoes/biblio-apendices.md`, caminhos que não existem.
**Efeitos colaterais**: link quebrado em `instrucoes/financeiro.md`; quem seguir as referências antigas não acha a escala N1–N6, a metodologia nem as normas de bibliografia.

### 10:58
**Objeto**: Notion, novo banco de dados "Status da coleta"
**Antes**: sem controle da completude da coleta por estabelecimento; o andamento só aparecia ao consultar os bancos "A - Estabelecimentos" e "B - Comentários".
**Depois**: banco com as 51 luderias aprovadas (`bloco_b_luderias_aprovadas_metropoles_mais_100_avaliacoes.xlsx`) e quatro colunas de status (Instagram, Cardápio, Localização, Comentários), com os valores "Não coletado", "Coleta parcial" ou "Coleta completa", conferidos em 12/10/2026. Critérios estão na descrição de cada coluna. No A, completo quer dizer todos os campos do grupo preenchidos. No B, parcial quer dizer até 40 comentários e nenhum com data relativa de 1 mês ou mais. As colunas são do tipo seleção, não status, porque a API do Notion não deixa criar opções próprias em coluna de status. Os valores não se atualizam sozinhos.
**Justificativa**: pedido do autor, para acompanhar o que falta coletar. Lista base: as 51 aprovadas na curadoria, escolhidas pelo autor no lugar de `bloco_b_triagem.csv`, que é só a fila da triagem manual das lojas (4 aprovadas, uma delas entre as 51).
