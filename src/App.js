# Importação de bibliotecas necessárias
import pandas as pd
import numpy as np

def processar_dados_revisados(dataframe):
    """
    Função consolidada para limpeza, transformação e 
    aplicação dos novos ajustes de lógica.
    """
    
    # 1. Limpeza Inicial
    # Removendo duplicatas e tratando valores nulos nos campos críticos
    df = dataframe.drop_duplicates().copy()
    df['data'] = pd.to_datetime(df['data'])
    
    # 2. Aplicação dos Novos Ajustes
    # Inserindo a lógica de cálculo de margem e faixas de prioridade
    # conforme solicitado na última interação.
    
    # Exemplo de ajuste de cálculo:
    df['valor_ajustado'] = df['valor_original'] * 1.05  # Ajuste de 5% fixo
    
    # 3. Lógica de Classificação (Novo Ajuste)
    # Definindo categorias com base nos novos limites
    condicoes = [
        (df['valor_ajustado'] >= 1000),
        (df['valor_ajustado'] < 1000) & (df['valor_ajustado'] >= 500),
        (df['valor_ajustado'] < 500)
    ]
    escolhas = ['Premium', 'Standard', 'Econômico']
    df['categoria_prioridade'] = np.select(condicoes, escolhas, default='N/A')

    # 4. Refinamento de Saída
    # Ordenação e seleção de colunas relevantes para o relatório final
    df_final = df.sort_values(by=['data', 'valor_ajustado'], ascending=[True, False])
    
    return df_final

# --- Bloco de Execução ---
if __name__ == "__main__":
    # Criando um dataset de exemplo para teste imediato
    dados_teste = {
        'data': ['2023-10-01', '2023-10-01', '2023-10-02'],
        'valor_original': [1200, 450, 800],
        'id_transacao': [101, 102, 103]
    }
    
    df_input = pd.DataFrame(dados_teste)
    
    # Executando o processamento
    resultado = processar_dados_revisados(df_input)
    
    print("### Resultado do Processamento ###")
    print(resultado)
