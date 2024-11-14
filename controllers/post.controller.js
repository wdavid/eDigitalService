const Post = require('../models/post.model');
const controller = {};
const Mongoose = require('mongoose');

// Crear un nuevo registro de consumo
controller.create = async (req, res, next) => {
    try {
        const { userId, volumen, vasos } = req.body;

        // Validar que los datos necesarios estén presentes
        if (!userId || !volumen || !vasos) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        // Crear el registro
        const post = new Post({
            userId,
            volumen,
            vasos,
        });

        const postSave = await post.save();
        if (!postSave) {
            return res.status(400).json({ error: "Error creating post" });
        }

        return res.status(201).json(postSave);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Obtener todos los registros de consumo
controller.findAll = async (req, res, next) => {
    try {
        // Buscar registros con información del usuario
        const posts = await Post.find().populate('userId', 'username email');
        if (!posts || posts.length === 0) {
            return res.status(404).json({ error: "Posts not found" });
        }

        return res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Obtener un registro de consumo por ID
controller.findOneById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id).populate('userId', 'username email');
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        return res.status(200).json(post);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Eliminar un registro de consumo por ID
controller.deleteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findByIdAndDelete(id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        return res.status(200).json({ message: "Post deleted" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

controller.getDailyConsumption = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Validar que el userId sea un ObjectId válido
        if (!Mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }

        const dailyConsumption = await Post.aggregate([
            {
                $match: {
                    userId: new Mongoose.Types.ObjectId(userId) // Usar new para ObjectId
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    totalVolumen: { $sum: "$volumen" },
                    totalVasos: { $sum: "$vasos" }
                }
            },
            { $sort: { _id: 1 } } // Ordenar por fecha
        ]);

        return res.status(200).json(dailyConsumption);
    } catch (error) {
        console.error("Error en getDailyConsumption:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

controller.getWeeklyConsumption = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const weeklyConsumption = await Post.aggregate([
            { $match: { userId: new Mongoose.Types.ObjectId(userId) } }, // Filtrar por usuario
            { $group: {
                _id: { 
                    year: { $year: "$fecha" }, // Año
                    week: { $isoWeek: "$fecha" } // Semana ISO
                },
                totalVolumen: { $sum: "$volumen" },
                totalVasos: { $sum: "$vasos" },
            }},
            { $sort: { "_id.year": 1, "_id.week": 1 } } // Ordenar por año y semana
        ]);

        return res.status(200).json(weeklyConsumption);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

controller.getMonthlyConsumption = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const monthlyConsumption = await Post.aggregate([
            { $match: { userId: new Mongoose.Types.ObjectId(userId) } }, // Filtrar por usuario
            { $group: {
                _id: { 
                    year: { $year: "$fecha" }, // Año
                    month: { $month: "$fecha" } // Mes
                },
                totalVolumen: { $sum: "$volumen" },
                totalVasos: { $sum: "$vasos" },
            }},
            { $sort: { "_id.year": 1, "_id.month": 1 } } // Ordenar por año y mes
        ]);

        return res.status(200).json(monthlyConsumption);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


module.exports = controller;
