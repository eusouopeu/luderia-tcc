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
