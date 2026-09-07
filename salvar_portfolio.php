<?php
header('Content-Type: application/json');

<<<<<<< HEAD
// Caminho relativo assumindo que o salvar_portfolio.php está na mesma pasta que o admin.html
$arquivo = 'assets/data/portfolio.json'; 
=======
// Ajuste o caminho caso a pasta assets esteja em outro nível de diretório
$arquivo = '../assets/data/portfolio.json'; 
>>>>>>> e8e24afefce05ccbae4575336ec19fcaf217f0c9

$dados = file_get_contents("php://input");

if ($dados) {
    if (file_put_contents($arquivo, $dados) !== false) {
<<<<<<< HEAD
        echo json_encode(["status" => "sucesso", "mensagem" => "Arquivo atualizado com sucesso!"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "erro", "mensagem" => "Falha de permissão ao gravar no servidor."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "erro", "mensagem" => "Nenhum dado recebido."]);
=======
        echo json_encode(["status" => "sucesso"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "erro", "mensagem" => "Falha de permissão ao gravar."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "erro", "mensagem" => "Sem dados."]);
>>>>>>> e8e24afefce05ccbae4575336ec19fcaf217f0c9
}
?>