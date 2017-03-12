<?php

class Conf {
    
    private static $database = array(
        'hostname' => 'infolimon.iutmontp.univ-montp2.fr',
        'database' => 'kizardjianl',
        'login'    => 'kizardjianl',
        'password' => '0207030504G'
    );

    static public function getLogin() {
        return self::$database['login'];
    }

    static public function getHostname() {
        return self::$database['hostname'];
    }

    static public function getDatabase() {
        return self::$database['database'];
    }

    static public function getPassword() {
        return self::$database['password'];
    }

}

class Model {

    public static $pdo;

    public static function init_pdo() {
        $host   = Conf::getHostname();
        $dbname = Conf::getDatabase();
        $login  = Conf::getLogin();
        $pass   = Conf::getPassword();
        try {
            // connexion à la base de données            
            // le dernier argument sert à ce que toutes les chaines de charactères 
            // en entrée et sortie de MySql soit dans le codage UTF-8
            self::$pdo = new PDO("mysql:host=$host;dbname=$dbname", $login, $pass, array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"));
            // on active le mode d'affichage des erreurs, et le lancement d'exception en cas d'erreur
            self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $ex) {
            echo $ex->getMessage();
            die("Problème lors de la connexion à la base de données.");
        }
    }

    public static function majScore($score) {
        try {
            // préparation de la requête
            $sql1 = "SELECT BestScore FROM jsworldgen";
			$buff = self::$pdo->query($sql1);
			$bestScore = $buff->setFetchMode(PDO::FETCH_NUM);
			if($score > $bestScore){
				$sql2 = "UPDATE jsworldgen SET BestScore = :buffScore";
				$req_prep = self::$pdo->prepare($sql2);
				$values = array("buffScore" => $score);
				// exécution de la requête préparée
				$req_prep->execute($values);
				return $score;
			}else{
				return $bestScore;
			}
        } catch (PDOException $e) {
            echo $e->getMessage();
            die("Erreur lors de la recherche dans la base de données.");
        }
    }

}

Model::init_pdo();
$score = $_POST["score"];
$res = Model::majScore($score);
echo json_encode($res);