package com.ricordi.repository;

import com.ricordi.model.TodoTask;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TodoTaskRepository extends JpaRepository<TodoTask, Long> {

    List<TodoTask> findAllByOrderByCreatedAtDesc();

    List<TodoTask> findAllByOrderByCompletedAscCreatedAtDesc();

    List<TodoTask> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}
